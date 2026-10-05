import { PrismaClient } from '@prisma/client';
import { createExchangeAdapter, type BaseExchangeAdapter } from '@adapters/index';
import { signalEngine } from './signalEngine';
import { riskEngine } from './riskEngine';
import { marketDataService } from './marketData';
import type {
  ExchangeName,
  OrderParams,
  OrderResult,
  PositionInfo,
  TradeMode,
  SignalInput,
  SignalOutput,
  Timeframe,
  OrderSide,
  OrderType,
  PositionSide,
} from '@risky-dex/shared';
import { encrypt, decrypt } from '../utils/encryption';

export class TradingService {
  private adapters: Map<string, BaseExchangeAdapter> = new Map();
  
  async getAdapter(exchangeAccountId: string): Promise<BaseExchangeAdapter> {
    let adapter = this.adapters.get(exchangeAccountId);
    
    if (!adapter) {
      const account = await prisma.exchangeAccount.findUnique({
        where: { id: exchangeAccountId },
        include: { apiKey: true },
      });
      
      if (!account) throw new Error('Exchange account not found');
      if (!account.isActive) throw new Error('Exchange account is inactive');
      
      const apiKey = account.apiKey;
      const credentials = {
        apiKey: decrypt(apiKey.apiKeyEncrypted),
        apiSecret: decrypt(apiKey.apiSecretEncrypted),
        passphrase: apiKey.apiPassphraseEncrypted ? decrypt(apiKey.apiPassphraseEncrypted) : undefined,
      };
      
      adapter = createExchangeAdapter(account.exchange, credentials);
      this.adapters.set(exchangeAccountId, adapter);
    }
    
    return adapter;
  }
  
  async generateSignal(params: {
    exchangeAccountId: string;
    symbol: string;
    timeframe: Timeframe;
  }): Promise<SignalOutput> {
    const account = await prisma.exchangeAccount.findUnique({
      where: { id: params.exchangeAccountId },
      include: { apiKey: true },
    });
    
    if (!account) throw new Error('Exchange account not found');
    
    const marketData = await marketDataService.getMarketData(
      account.exchange,
      params.symbol,
      params.timeframe
    );
    
    const balances = await this.getBalances(params.exchangeAccountId);
    
    const signalInput: SignalInput = {
      symbol: params.symbol,
      timeframe: params.timeframe,
      exchange: account.exchange,
      candles: marketData.candles,
      ticker: marketData.ticker,
      orderBook: marketData.orderBook,
      fundingRate: marketData.fundingRate,
      openInterest: marketData.openInterest,
      currentBalance: balances,
    };
    
    const signal = await signalEngine.analyze(signalInput);
    
    await prisma.signal.create({
      data: {
        botId: params.exchangeAccountId,
        exchangeAccountId: params.exchangeAccountId,
        symbol: params.symbol,
        baseAsset: params.symbol.split('/')[0],
        quoteAsset: params.symbol.split('/')[1],
        timeframe: params.timeframe,
        direction: signal.direction,
        strength: signal.strength,
        confidence: signal.confidence,
        entryPrice: signal.entryPrice,
        entryZoneLow: signal.entryZoneLow,
        entryZoneHigh: signal.entryZoneHigh,
        stopLoss: signal.stopLoss,
        takeProfit1: signal.takeProfit1,
        takeProfit2: signal.takeProfit2,
        riskReward: signal.riskReward,
        invalidationLevel: signal.invalidationLevel,
        trendScore: signal.trendScore,
        momentumScore: signal.momentumScore,
        volumeScore: signal.volumeScore,
        structureScore: signal.structureScore,
        futuresScore: signal.futuresScore,
        riskScore: signal.riskScore,
        indicators: signal.indicators,
        supportLevels: signal.supportLevels,
        resistanceLevels: signal.resistanceLevels,
        fundingRate: signal.fundingRate,
        openInterest: signal.openInterest,
        volumeAnalysis: signal.volumeAnalysis,
        reasons: signal.reasons,
        warnings: signal.warnings,
      },
    });
    
    return signal;
  }
  
  async getBalances(exchangeAccountId: string) {
    const adapter = await this.getAdapter(exchangeAccountId);
    return adapter.getBalances();
  }
  
  async placeOrder(params: {
    userId: string;
    exchangeAccountId: string;
    botId?: string;
    order: OrderParams;
    tradeMode: TradeMode;
  }): Promise<OrderResult> {
    const { userId, exchangeAccountId, botId, order, tradeMode } = params;
    
    const account = await prisma.exchangeAccount.findUnique({
      where: { id: exchangeAccountId },
    });
    
    if (!account) throw new Error('Exchange account not found');
    
    const currentPositions = await prisma.position.findMany({
      where: { exchangeAccountId, status: 'OPEN' },
    });
    
    const dailyPnl = await this.getDailyPnl(userId);
    
    const validation = riskEngine.validateOrder({
      order,
      balance: 10000,
      currentPositions: currentPositions as any,
      dailyPnl,
    });
    
    if (!validation.valid) {
      throw new Error(`Order validation failed: ${validation.errors.join(', ')}`);
    }
    
    let result: OrderResult;
    
    if (tradeMode === 'PAPER') {
      result = await this.simulateOrder(order);
    } else {
      const adapter = await this.getAdapter(exchangeAccountId);
      result = await adapter.createOrder(order);
    }
    
    await prisma.order.create({
      data: {
        userId,
        botId,
        exchangeAccountId,
        exchangeOrderId: result.id,
        clientOrderId: result.clientOrderId,
        symbol: order.symbol,
        baseAsset: order.symbol.split('/')[0],
        quoteAsset: order.symbol.split('/')[1],
        side: order.side,
        type: order.type,
        price: order.price || 0,
        stopPrice: order.stopPrice,
        amount: order.amount,
        filledAmount: result.filledAmount,
        remainingAmount: order.amount - result.filledAmount,
        value: result.filledAmount * (order.price || 0),
        fee: result.fee,
        feeAsset: result.feeAsset,
        status: result.status,
        tradeMode,
        reduceOnly: order.reduceOnly || false,
        postOnly: order.postOnly || false,
        timeInForce: order.timeInForce,
      },
    });
    
    return result;
  }
  
  private async simulateOrder(order: OrderParams): Promise<OrderResult> {
    const ticker = await marketDataService.getTicker('BINANCE', order.symbol);
    const fillPrice = order.type === 'MARKET' 
      ? (order.side === 'BUY' ? ticker.ask : ticker.bid)
      : (order.price || ticker.price);
    
    const fee = fillPrice * order.amount * 0.001;
    
    return {
      id: `paper-${Date.now()}`,
      clientOrderId: order.clientOrderId,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      price: fillPrice,
      amount: order.amount,
      filledAmount: order.amount,
      status: 'FILLED',
      fee,
      feeAsset: order.symbol.split('/')[1],
      timestamp: Date.now(),
    };
  }
  
  async cancelOrder(exchangeAccountId: string, orderId: string, symbol: string): Promise<void> {
    const adapter = await this.getAdapter(exchangeAccountId);
    await adapter.cancelOrder(orderId, symbol);
    
    await prisma.order.update({
      where: { exchangeOrderId: orderId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }
  
  async closePosition(exchangeAccountId: string, positionId: string, percentage = 100): Promise<OrderResult> {
    const position = await prisma.position.findUnique({ where: { id: positionId } });
    if (!position) throw new Error('Position not found');
    
    const adapter = await this.getAdapter(exchangeAccountId);
    const result = await adapter.closePosition(position.symbol, percentage);
    
    await prisma.order.create({
      data: {
        userId: position.userId,
        botId: position.botId,
        exchangeAccountId,
        exchangeOrderId: result.id,
        symbol: position.symbol,
        baseAsset: position.baseAsset,
        quoteAsset: position.quoteAsset,
        side: position.side === 'LONG' ? 'SELL' : 'BUY',
        type: 'MARKET',
        price: result.price,
        amount: position.size * (percentage / 100),
        filledAmount: result.filledAmount,
        remainingAmount: 0,
        value: result.filledAmount * result.price,
        fee: result.fee,
        feeAsset: result.feeAsset,
        status: result.status,
        tradeMode: position.tradeMode,
        reduceOnly: true,
      },
    });
    
    if (percentage >= 100) {
      await prisma.position.update({
        where: { id: positionId },
        data: { status: 'CLOSED', closedAt: new Date() },
      });
    }
    
    return result;
  }
  
  async modifyPosition(exchangeAccountId: string, positionId: string, stopLoss?: number, takeProfit?: number): Promise<void> {
    const position = await prisma.position.findUnique({ where: { id: positionId } });
    if (!position) throw new Error('Position not found');
    
    const adapter = await this.getAdapter(exchangeAccountId);
    
    if (stopLoss) {
      await prisma.position.update({ where: { id: positionId }, data: { stopLoss } });
    }
    
    if (takeProfit) {
      await prisma.position.update({ where: { id: positionId }, data: { takeProfit } });
    }
  }
  
  async getPositions(exchangeAccountId: string): Promise<PositionInfo[]> {
    const adapter = await this.getAdapter(exchangeAccountId);
    return adapter.getPositions();
  }
  
  async syncPositions(exchangeAccountId: string): Promise<void> {
    const adapter = await this.getAdapter(exchangeAccountId);
    const positions = await adapter.getPositions();
    
    for (const pos of positions) {
      await prisma.position.upsert({
        where: { id: pos.id },
        create: {
          userId: '',
          exchangeAccountId,
          symbol: pos.symbol,
          baseAsset: pos.symbol.split('/')[0],
          quoteAsset: pos.symbol.split('/')[1],
          side: pos.side,
          entryPrice: pos.entryPrice,
          currentPrice: pos.currentPrice,
          size: pos.size,
          value: pos.value,
          leverage: pos.leverage,
          margin: pos.margin,
          unrealizedPnl: pos.unrealizedPnl,
          realizedPnl: pos.realizedPnl,
          pnlPercent: (pos.unrealizedPnl / pos.value) * 100,
          stopLoss: pos.stopLoss,
          takeProfit: pos.takeProfit,
          liquidationPrice: pos.liquidationPrice,
          status: pos.status,
          tradeMode: 'LIVE',
        },
        update: {
          currentPrice: pos.currentPrice,
          size: pos.size,
          value: pos.value,
          unrealizedPnl: pos.unrealizedPnl,
          realizedPnl: pos.realizedPnl,
          pnlPercent: (pos.unrealizedPnl / pos.value) * 100,
          stopLoss: pos.stopLoss,
          takeProfit: pos.takeProfit,
          liquidationPrice: pos.liquidationPrice,
          status: pos.status,
          updatedAt: new Date(),
        },
      });
    }
  }
  
  async createPaperTrade(params: {
    userId: string;
    exchangeAccountId: string;
    botId?: string;
    symbol: string;
    side: OrderSide;
    type: OrderType;
    price: number;
    amount: number;
    signalId?: string;
  }) {
    const { userId, exchangeAccountId, botId, symbol, side, type, price, amount, signalId } = params;
    
    const fee = price * amount * 0.001;
    const value = price * amount;
    
    const trade = await prisma.trade.create({
      data: {
        userId,
        botId,
        exchangeAccountId,
        symbol,
        baseAsset: symbol.split('/')[0],
        quoteAsset: symbol.split('/')[1],
        side,
        type,
        price,
        amount,
        value,
        fee,
        feeAsset: symbol.split('/')[1],
        status: 'FILLED',
        tradeMode: 'PAPER',
        signalId,
        executedAt: new Date(),
      },
    });
    
    return trade;
  }
  
  private async getDailyPnl(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const trades = await prisma.trade.findMany({
      where: {
        userId,
        executedAt: { gte: today },
        tradeMode: 'LIVE',
      },
    });
    
    return trades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
  }
}

export const tradingService = new TradingService();