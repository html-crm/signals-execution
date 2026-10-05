import crypto from 'crypto';
import type { WebSocket } from 'ws';
import { BaseExchangeAdapter, type ExchangeCredentials } from './base';
import type { Ticker, Candle, OrderBook, Balance, OrderParams, OrderResult, PositionInfo, FundingRate, OpenInterest, Timeframe } from '@risky-dex/shared';
import { config } from '../config';

const TIMEFRAME_MAP: Record<Timeframe, string> = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '30m': '30',
  '1h': '60',
  '4h': '240',
  '1d': 'D',
  '1w': 'W',
};

export class BybitAdapter extends BaseExchangeAdapter {
  readonly name = 'BYBIT' as const;
  readonly baseUrl = config.exchanges.bybit.testnetBaseUrl || config.exchanges.bybit.baseUrl;
  readonly wsUrl = config.exchanges.bybit.testnetWsUrl || config.exchanges.bybit.wsUrl;
  
  private recvWindow = 5000;
  
  constructor(credentials: ExchangeCredentials) {
    super(credentials);
  }
  
  protected signRequest(params: Record<string, unknown>): string {
    const timestamp = params.timestamp as number;
    const paramStr = `${timestamp}${this.credentials.apiKey}${this.recvWindow}${JSON.stringify(params)}`;
    return crypto
      .createHmac('sha256', this.credentials.apiSecret)
      .update(paramStr)
      .digest('hex');
  }
  
  protected getHeaders(): Record<string, string> {
    return {
      'X-BAPI-API-KEY': this.credentials.apiKey,
      'X-BAPI-TIMESTAMP': Date.now().toString(),
      'X-BAPI-RECV-WINDOW': this.recvWindow.toString(),
      'Content-Type': 'application/json',
    };
  }
  
  normalizeSymbol(symbol: string): string {
    return symbol.replace('/', '').toUpperCase();
  }
  
  denormalizeSymbol(symbol: string): string {
    const quoteAssets = ['USDT', 'USDC', 'BTC', 'ETH'];
    for (const quote of quoteAssets) {
      if (symbol.endsWith(quote)) {
        return `${symbol.slice(0, -quote.length)}/${quote}`;
      }
    }
    return symbol;
  }
  
  async getServerTime(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/v5/market/time`);
    const data = await response.json();
    return parseInt(data.result.timeSecond, 10) * 1000;
  }
  
  async getTicker(symbol: string): Promise<Ticker> {
    const normalized = this.normalizeSymbol(symbol);
    const data = await this.request<{ list: any[] }>('GET', '/v5/market/tickers', {
      category: 'linear',
      symbol: normalized,
    });
    
    const t = data.list[0];
    if (!t) throw new Error(`Symbol ${symbol} not found`);
    
    return {
      symbol,
      baseAsset: symbol.split('/')[0],
      quoteAsset: symbol.split('/')[1],
      price: parseFloat(t.lastPrice),
      priceChange24h: parseFloat(t.price24hPcnt) * parseFloat(t.lastPrice),
      priceChangePercent24h: parseFloat(t.price24hPcnt) * 100,
      volume24h: parseFloat(t.volume24h),
      volumeUsd24h: parseFloat(t.turnover24h),
      high24h: parseFloat(t.highPrice24h),
      low24h: parseFloat(t.lowPrice24h),
      bid: parseFloat(t.bid1Price),
      ask: parseFloat(t.ask1Price),
      bidSize: parseFloat(t.bid1Size),
      askSize: parseFloat(t.ask1Size),
      timestamp: Date.now(),
    };
  }
  
  async getTickers(symbols?: string[]): Promise<Ticker[]> {
    const category = 'linear';
    const data = await this.request<{ list: any[] }>('GET', '/v5/market/tickers', { category });
    
    let tickers = data.list;
    if (symbols && symbols.length > 0) {
      const normalizedSymbols = new Set(symbols.map(s => this.normalizeSymbol(s)));
      tickers = tickers.filter(t => normalizedSymbols.has(t.symbol));
    }
    
    return tickers.map(t => ({
      symbol: this.denormalizeSymbol(t.symbol),
      baseAsset: t.symbol.slice(0, -4),
      quoteAsset: t.symbol.slice(-4),
      price: parseFloat(t.lastPrice),
      priceChange24h: parseFloat(t.price24hPcnt) * parseFloat(t.lastPrice),
      priceChangePercent24h: parseFloat(t.price24hPcnt) * 100,
      volume24h: parseFloat(t.volume24h),
      volumeUsd24h: parseFloat(t.turnover24h),
      high24h: parseFloat(t.highPrice24h),
      low24h: parseFloat(t.lowPrice24h),
      bid: parseFloat(t.bid1Price),
      ask: parseFloat(t.ask1Price),
      bidSize: parseFloat(t.bid1Size),
      askSize: parseFloat(t.ask1Size),
      timestamp: Date.now(),
    }));
  }
  
  async getCandles(symbol: string, timeframe: Timeframe, limit = 500): Promise<Candle[]> {
    const normalized = this.normalizeSymbol(symbol);
    const interval = TIMEFRAME_MAP[timeframe];
    
    const data = await this.request<{ list: any[] }>('GET', '/v5/market/kline', {
      category: 'linear',
      symbol: normalized,
      interval,
      limit,
    });
    
    return data.list.map((c: any) => ({
      timestamp: parseInt(c[0]),
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5]),
      quoteVolume: parseFloat(c[6]),
      tradesCount: 0,
    })).reverse();
  }
  
  async getOrderBook(symbol: string, limit = 100): Promise<OrderBook> {
    const normalized = this.normalizeSymbol(symbol);
    const data = await this.request<{ b: string[][]; a: string[][]; u: number }>(
      'GET',
      '/v5/market/orderbook',
      { category: 'linear', symbol: normalized, limit }
    );
    
    return {
      symbol,
      bids: data.b.map(b => [parseFloat(b[0]), parseFloat(b[1])]),
      asks: data.a.map(a => [parseFloat(a[0]), parseFloat(a[1])]),
      timestamp: Date.now(),
    };
  }
  
  async getFundingRate(symbol: string): Promise<FundingRate> {
    const normalized = this.normalizeSymbol(symbol);
    const data = await this.request<{ list: any[] }>('GET', '/v5/market/funding/history', {
      category: 'linear',
      symbol: normalized,
      limit: 1,
    });
    
    const f = data.list[0];
    return {
      symbol,
      rate: parseFloat(f.fundingRate),
      nextFundingTime: parseInt(f.nextFundingTime),
      timestamp: Date.now(),
    };
  }
  
  async getOpenInterest(symbol: string): Promise<OpenInterest> {
    const normalized = this.normalizeSymbol(symbol);
    const data = await this.request<{ list: any[] }>('GET', '/v5/market/open-interest', {
      category: 'linear',
      symbol: normalized,
      intervalTime: '1min',
      limit: 1,
    });
    
    const oi = data.list[0];
    return {
      symbol,
      value: parseFloat(oi.openInterest),
      timestamp: parseInt(oi.timestamp),
    };
  }
  
  async get24hStats(symbol: string): Promise<{ volume24h: number; priceChange24h: number; priceChangePercent24h: number }> {
    const ticker = await this.getTicker(symbol);
    return {
      volume24h: ticker.volume24h,
      priceChange24h: ticker.priceChange24h,
      priceChangePercent24h: ticker.priceChangePercent24h,
    };
  }
  
  async getBalances(): Promise<Balance[]> {
    const data = await this.request<{ list: any[] }>('GET', '/v5/account/wallet-balance', {
      accountType: 'UNIFIED',
    }, true);
    
    const balances: Balance[] = [];
    for (const coin of data.list[0]?.coin || []) {
      const free = parseFloat(coin.availableToWithdraw || coin.walletBalance);
      const locked = parseFloat(coin.locked || '0');
      if (free > 0 || locked > 0) {
        balances.push({
          asset: coin.coin,
          free,
          locked,
          total: free + locked,
        });
      }
    }
    return balances;
  }
  
  async getBalance(asset: string): Promise<Balance | null> {
    const balances = await this.getBalances();
    return balances.find(b => b.asset === asset) || null;
  }
  
  async createOrder(params: OrderParams): Promise<OrderResult> {
    const normalized = this.normalizeSymbol(params.symbol);
    const orderParams: Record<string, unknown> = {
      category: 'linear',
      symbol: normalized,
      side: params.side,
      orderType: params.type === 'MARKET' ? 'Market' : 'Limit',
      qty: params.amount.toString(),
      timeInForce: params.timeInForce || 'GTC',
    };
    
    if (params.type !== 'MARKET') {
      orderParams.price = params.price?.toString();
    }
    if (params.stopPrice) {
      orderParams.triggerPrice = params.stopPrice.toString();
      orderParams.orderType = 'Stop';
    }
    if (params.reduceOnly) {
      orderParams.reduceOnly = true;
    }
    if (params.postOnly) {
      orderParams.postOnly = true;
    }
    if (params.clientOrderId) {
      orderParams.orderLinkId = params.clientOrderId;
    }
    
    const data = await this.request<any>('POST', '/v5/order/create', orderParams, true);
    
    return {
      id: data.result.orderId,
      clientOrderId: data.result.orderLinkId,
      symbol: params.symbol,
      side: params.side,
      type: params.type,
      price: params.price || 0,
      amount: params.amount,
      filledAmount: 0,
      status: 'OPEN',
      fee: 0,
      feeAsset: params.symbol.split('/')[1],
      timestamp: Date.now(),
    };
  }
  
  async cancelOrder(orderId: string, symbol: string): Promise<void> {
    const normalized = this.normalizeSymbol(symbol);
    await this.request('POST', '/v5/order/cancel', {
      category: 'linear',
      symbol: normalized,
      orderId,
    }, true);
  }
  
  async cancelAllOrders(symbol?: string): Promise<void> {
    const params: Record<string, unknown> = { category: 'linear' };
    if (symbol) {
      params.symbol = this.normalizeSymbol(symbol);
    }
    await this.request('POST', '/v5/order/cancel-all', params, true);
  }
  
  async getOrder(orderId: string, symbol: string): Promise<OrderResult> {
    const normalized = this.normalizeSymbol(symbol);
    const data = await this.request<{ list: any[] }>('GET', '/v5/order/realtime', {
      category: 'linear',
      symbol: normalized,
      orderId,
    }, true);
    
    const o = data.list[0];
    return {
      id: o.orderId,
      clientOrderId: o.orderLinkId,
      symbol,
      side: o.side,
      type: o.orderType === 'Market' ? 'MARKET' : 'LIMIT',
      price: parseFloat(o.price),
      amount: parseFloat(o.qty),
      filledAmount: parseFloat(o.cumExecQty),
      status: this.mapOrderStatus(o.orderStatus),
      fee: parseFloat(o.cumExecFee),
      feeAsset: o.feeCurrency,
      timestamp: parseInt(o.createdTime),
    };
  }
  
  async getOpenOrders(symbol?: string): Promise<OrderResult[]> {
    const params: Record<string, unknown> = { category: 'linear', openOnly: 1 };
    if (symbol) {
      params.symbol = this.normalizeSymbol(symbol);
    }
    const data = await this.request<{ list: any[] }>('GET', '/v5/order/realtime', params, true);
    
    return data.list.map(o => ({
      id: o.orderId,
      clientOrderId: o.orderLinkId,
      symbol: this.denormalizeSymbol(o.symbol),
      side: o.side,
      type: o.orderType === 'Market' ? 'MARKET' : 'LIMIT',
      price: parseFloat(o.price),
      amount: parseFloat(o.qty),
      filledAmount: parseFloat(o.cumExecQty),
      status: this.mapOrderStatus(o.orderStatus),
      fee: 0,
      feeAsset: o.feeCurrency,
      timestamp: parseInt(o.createdTime),
    }));
  }
  
  async getOrderHistory(symbol: string, limit = 100): Promise<OrderResult[]> {
    const normalized = this.normalizeSymbol(symbol);
    const data = await this.request<{ list: any[] }>('GET', '/v5/order/history', {
      category: 'linear',
      symbol: normalized,
      limit,
    }, true);
    
    return data.list.map(o => ({
      id: o.orderId,
      clientOrderId: o.orderLinkId,
      symbol,
      side: o.side,
      type: o.orderType === 'Market' ? 'MARKET' : 'LIMIT',
      price: parseFloat(o.price),
      amount: parseFloat(o.qty),
      filledAmount: parseFloat(o.cumExecQty),
      status: this.mapOrderStatus(o.orderStatus),
      fee: parseFloat(o.cumExecFee),
      feeAsset: o.feeCurrency,
      timestamp: parseInt(o.createdTime),
    }));
  }
  
  async getPositions(): Promise<PositionInfo[]> {
    const data = await this.request<{ list: any[] }>('GET', '/v5/position/list', {
      category: 'linear',
      settleCoin: 'USDT',
    }, true);
    
    return data.list
      .filter(p => parseFloat(p.size) > 0)
      .map(p => ({
        id: `${p.symbol}-${p.side}`,
        symbol: this.denormalizeSymbol(p.symbol),
        side: p.side === 'Buy' ? 'LONG' : 'SHORT',
        entryPrice: parseFloat(p.avgPrice),
        currentPrice: parseFloat(p.markPrice),
        size: parseFloat(p.size),
        value: parseFloat(p.positionValue),
        leverage: parseInt(p.leverage),
        margin: parseFloat(p.positionIM),
        unrealizedPnl: parseFloat(p.unrealisedPnl),
        realizedPnl: parseFloat(p.cumRealisedPnl),
        stopLoss: parseFloat(p.stopLoss) || undefined,
        takeProfit: parseFloat(p.takeProfit) || undefined,
        liquidationPrice: parseFloat(p.liqPrice) || undefined,
        status: 'OPEN',
        timestamp: parseInt(p.updatedTime),
      }));
  }
  
  async getPosition(symbol: string): Promise<PositionInfo | null> {
    const positions = await this.getPositions();
    return positions.find(p => p.symbol === symbol) || null;
  }
  
  async closePosition(symbol: string, percentage = 100): Promise<OrderResult> {
    const position = await this.getPosition(symbol);
    if (!position) {
      throw new Error(`No open position for ${symbol}`);
    }
    
    const side = position.side === 'LONG' ? 'SELL' : 'BUY';
    const amount = position.size * (percentage / 100);
    
    return this.createOrder({
      symbol,
      side,
      type: 'MARKET',
      amount,
      reduceOnly: true,
    });
  }
  
  async setLeverage(symbol: string, leverage: number): Promise<void> {
    const normalized = this.normalizeSymbol(symbol);
    await this.request('POST', '/v5/position/set-leverage', {
      category: 'linear',
      symbol: normalized,
      buyLeverage: leverage.toString(),
      sellLeverage: leverage.toString(),
    }, true);
  }
  
  async setMarginType(symbol: string, marginType: 'ISOLATED' | 'CROSSED'): Promise<void> {
    const normalized = this.normalizeSymbol(symbol);
    await this.request('POST', '/v5/position/switch-isolated', {
      category: 'linear',
      symbol: normalized,
      tradeMode: marginType === 'ISOLATED' ? 1 : 0,
      buyLeverage: '1',
      sellLeverage: '1',
    }, true);
  }
  
  subscribeTicker(symbol: string, callback: (ticker: Ticker) => void): () => void {
    const normalized = this.normalizeSymbol(symbol);
    const ws = new WebSocket(this.wsUrl);
    this.wsConnections.set(`ticker-${symbol}`, ws);
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        op: 'subscribe',
        args: [`tickers.${normalized}`],
      }));
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.topic?.startsWith('tickers.')) {
          const t = msg.data;
          callback({
            symbol,
            baseAsset: symbol.split('/')[0],
            quoteAsset: symbol.split('/')[1],
            price: parseFloat(t.lastPrice),
            priceChange24h: parseFloat(t.price24hPcnt) * parseFloat(t.lastPrice),
            priceChangePercent24h: parseFloat(t.price24hPcnt) * 100,
            volume24h: parseFloat(t.volume24h),
            volumeUsd24h: parseFloat(t.turnover24h),
            high24h: parseFloat(t.highPrice24h),
            low24h: parseFloat(t.lowPrice24h),
            bid: parseFloat(t.bid1Price),
            ask: parseFloat(t.ask1Price),
            bidSize: parseFloat(t.bid1Size),
            askSize: parseFloat(t.ask1Size),
            timestamp: msg.ts,
          });
        }
      } catch (e) {
        console.error('Bybit ticker parse error:', e);
      }
    });
    
    return () => {
      ws.close();
      this.wsConnections.delete(`ticker-${symbol}`);
    };
  }
  
  subscribeCandles(symbol: string, timeframe: Timeframe, callback: (candle: Candle) => void): () => void {
    const normalized = this.normalizeSymbol(symbol);
    const interval = TIMEFRAME_MAP[timeframe];
    const ws = new WebSocket(this.wsUrl);
    this.wsConnections.set(`candle-${symbol}-${timeframe}`, ws);
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        op: 'subscribe',
        args: [`kline.${interval}.${normalized}`],
      }));
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.topic?.startsWith('kline.')) {
          for (const c of msg.data) {
            callback({
              timestamp: c.start,
              open: parseFloat(c.open),
              high: parseFloat(c.high),
              low: parseFloat(c.low),
              close: parseFloat(c.close),
              volume: parseFloat(c.volume),
              quoteVolume: parseFloat(c.turnover),
              tradesCount: 0,
            });
          }
        }
      } catch (e) {
        console.error('Bybit candle parse error:', e);
      }
    });
    
    return () => {
      ws.close();
      this.wsConnections.delete(`candle-${symbol}-${timeframe}`);
    };
  }
  
  subscribeOrderBook(symbol: string, callback: (orderBook: OrderBook) => void): () => void {
    const normalized = this.normalizeSymbol(symbol);
    const ws = new WebSocket(this.wsUrl);
    this.wsConnections.set(`orderbook-${symbol}`, ws);
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        op: 'subscribe',
        args: [`orderbook.50.${normalized}`],
      }));
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.topic?.startsWith('orderbook.')) {
          const d = msg.data;
          callback({
            symbol,
            bids: d.b.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
            asks: d.a.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]),
            timestamp: msg.ts,
          });
        }
      } catch (e) {
        console.error('Bybit orderbook parse error:', e);
      }
    });
    
    return () => {
      ws.close();
      this.wsConnections.delete(`orderbook-${symbol}`);
    };
  }
  
  subscribeTrades(symbol: string, callback: (trade: { price: number; amount: number; side: 'BUY' | 'SELL'; timestamp: number }) => void): () => void {
    const normalized = this.normalizeSymbol(symbol);
    const ws = new WebSocket(this.wsUrl);
    this.wsConnections.set(`trades-${symbol}`, ws);
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        op: 'subscribe',
        args: [`publicTrade.${normalized}`],
      }));
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.topic?.startsWith('publicTrade.')) {
          for (const t of msg.data) {
            callback({
              price: parseFloat(t.p),
              amount: parseFloat(t.v),
              side: t.S === 'Buy' ? 'BUY' : 'SELL',
              timestamp: t.T,
            });
          }
        }
      } catch (e) {
        console.error('Bybit trade parse error:', e);
      }
    });
    
    return () => {
      ws.close();
      this.wsConnections.delete(`trades-${symbol}`);
    };
  }
  
  private mapOrderStatus(status: string): OrderResult['status'] {
    const statusMap: Record<string, OrderResult['status']> = {
      Created: 'OPEN',
      New: 'OPEN',
      PartiallyFilled: 'PARTIALLY_FILLED',
      Filled: 'FILLED',
      Cancelled: 'CANCELLED',
      Rejected: 'FAILED',
      PartiallyFilledCanceled: 'CANCELLED',
    };
    return statusMap[status] || 'PENDING';
  }
}