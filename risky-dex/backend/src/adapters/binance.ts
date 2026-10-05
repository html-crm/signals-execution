import crypto from 'crypto';
import type { WebSocket } from 'ws';
import { BaseExchangeAdapter, type ExchangeCredentials } from './base';
import type { Ticker, Candle, OrderBook, Balance, OrderParams, OrderResult, PositionInfo, FundingRate, OpenInterest, Timeframe } from '@risky-dex/shared';
import { config } from '../config';

const TIMEFRAME_MAP: Record<Timeframe, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
  '1w': '1w',
};

export class BinanceAdapter extends BaseExchangeAdapter {
  readonly name = 'BINANCE' as const;
  readonly baseUrl = config.exchanges.binance.testnetBaseUrl || config.exchanges.binance.baseUrl;
  readonly wsUrl = config.exchanges.binance.testnetWsUrl || config.exchanges.binance.wsUrl;
  
  constructor(credentials: ExchangeCredentials) {
    super(credentials);
  }
  
  protected signRequest(params: Record<string, unknown>): string {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    return crypto
      .createHmac('sha256', this.credentials.apiSecret)
      .update(queryString)
      .digest('hex');
  }
  
  protected getHeaders(): Record<string, string> {
    return {
      'X-MBX-APIKEY': this.credentials.apiKey,
    };
  }
  
  normalizeSymbol(symbol: string): string {
    return symbol.replace('/', '').toUpperCase();
  }
  
  denormalizeSymbol(symbol: string): string {
    const quoteAssets = ['USDT', 'USDC', 'BTC', 'ETH', 'BNB'];
    for (const quote of quoteAssets) {
      if (symbol.endsWith(quote)) {
        return `${symbol.slice(0, -quote.length)}/${quote}`;
      }
    }
    return symbol;
  }
  
  async getServerTime(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/api/v3/time`);
    const data = await response.json();
    return data.serverTime;
  }
  
  async getTicker(symbol: string): Promise<Ticker> {
    const normalized = this.normalizeSymbol(symbol);
    const [ticker24h, bookTicker] = await Promise.all([
      this.request<{ priceChange: string; priceChangePercent: string; weightedAvgPrice: string; prevClosePrice: string; lastPrice: string; lastQty: string; bidPrice: string; askPrice: string; openPrice: string; highPrice: string; lowPrice: string; volume: string; quoteVolume: string; openTime: number; closeTime: number; count: number }>(
        'GET',
        '/api/v3/ticker/24hr',
        { symbol: normalized }
      ),
      this.request<{ symbol: string; bidPrice: string; bidQty: string; askPrice: string; askQty: string }>(
        'GET',
        '/api/v3/ticker/bookTicker',
        { symbol: normalized }
      ),
    ]);
    
    return {
      symbol,
      baseAsset: symbol.split('/')[0],
      quoteAsset: symbol.split('/')[1],
      price: parseFloat(ticker24h.lastPrice),
      priceChange24h: parseFloat(ticker24h.priceChange),
      priceChangePercent24h: parseFloat(ticker24h.priceChangePercent),
      volume24h: parseFloat(ticker24h.volume),
      volumeUsd24h: parseFloat(ticker24h.quoteVolume),
      high24h: parseFloat(ticker24h.highPrice),
      low24h: parseFloat(ticker24h.lowPrice),
      bid: parseFloat(bookTicker.bidPrice),
      ask: parseFloat(bookTicker.askPrice),
      bidSize: parseFloat(bookTicker.bidQty),
      askSize: parseFloat(bookTicker.askQty),
      timestamp: Date.now(),
    };
  }
  
  async getTickers(symbols?: string[]): Promise<Ticker[]> {
    if (symbols && symbols.length > 0) {
      return Promise.all(symbols.map(s => this.getTicker(s)));
    }
    
    const [tickers24h, bookTickers] = await Promise.all([
      this.request<any[]>('GET', '/api/v3/ticker/24hr'),
      this.request<any[]>('GET', '/api/v3/ticker/bookTicker'),
    ]);
    
    const bookTickerMap = new Map(bookTickers.map(t => [t.symbol, t]));
    
    return tickers24h.map(t => {
      const bt = bookTickerMap.get(t.symbol);
      return {
        symbol: this.denormalizeSymbol(t.symbol),
        baseAsset: t.symbol.slice(0, -4),
        quoteAsset: t.symbol.slice(-4),
        price: parseFloat(t.lastPrice),
        priceChange24h: parseFloat(t.priceChange),
        priceChangePercent24h: parseFloat(t.priceChangePercent),
        volume24h: parseFloat(t.volume),
        volumeUsd24h: parseFloat(t.quoteVolume),
        high24h: parseFloat(t.highPrice),
        low24h: parseFloat(t.lowPrice),
        bid: bt ? parseFloat(bt.bidPrice) : parseFloat(t.lastPrice),
        ask: bt ? parseFloat(bt.askPrice) : parseFloat(t.lastPrice),
        bidSize: bt ? parseFloat(bt.bidQty) : 0,
        askSize: bt ? parseFloat(bt.askQty) : 0,
        timestamp: Date.now(),
      };
    });
  }
  
  async getCandles(symbol: string, timeframe: Timeframe, limit = 500): Promise<Candle[]> {
    const normalized = this.normalizeSymbol(symbol);
    const interval = TIMEFRAME_MAP[timeframe];
    
    const data = await this.request<any[]>('GET', '/api/v3/klines', {
      symbol: normalized,
      interval,
      limit,
    });
    
    return data.map((c: any) => ({
      timestamp: c[0],
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5]),
      quoteVolume: parseFloat(c[7]),
      tradesCount: c[8],
    }));
  }
  
  async getOrderBook(symbol: string, limit = 100): Promise<OrderBook> {
    const normalized = this.normalizeSymbol(symbol);
    const data = await this.request<{ lastUpdateId: number; bids: string[][]; asks: string[][] }>(
      'GET',
      '/api/v3/depth',
      { symbol: this.normalizeSymbol(symbol), limit }
    );
    
    return {
      symbol: this.denormalizeSymbol(symbol),
      bids: data.bids.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
      asks: data.asks.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]),
      timestamp: Date.now(),
    };
  }
  
  async getFundingRate(symbol: string): Promise<FundingRate> {
    const normalized = this.normalizeSymbol(symbol);
    const data = await this.request<{
      symbol: string;
      markPrice: string;
      indexPrice: string;
      estimatedSettlePrice: string;
      lastFundingRate: string;
      nextFundingTime: number;
      interestRate: string;
      time: number;
    }>('GET', '/fapi/v1/premiumIndex', { symbol: this.normalizeSymbol(symbol) });
    
    return {
      symbol: this.denormalizeSymbol(symbol),
      rate: parseFloat(data.lastFundingRate),
      nextFundingTime: data.nextFundingTime,
      timestamp: data.time,
    };
  }
  
  async getOpenInterest(symbol: string): Promise<OpenInterest> {
    const normalized = this.normalizeSymbol(symbol);
    const data = await this.request<{ symbol: string; openInterest: string; time: number }>(
      'GET',
      '/fapi/v1/openInterest',
      { symbol: this.normalizeSymbol(symbol) }
    );
    
    return {
      symbol: this.denormalizeSymbol(symbol),
      value: parseFloat(data.openInterest),
      timestamp: data.time,
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
    const data = await this.request<{ balances: { asset: string; free: string; locked: string }[] }>(
      'GET',
      '/fapi/v2/balance',
      {},
      true
    );
    
    return data.balances
      .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
      .map(b => ({
        asset: b.asset,
        free: parseFloat(b.free),
        locked: parseFloat(b.locked),
        total: parseFloat(b.free) + parseFloat(b.locked),
      }));
  }
  
  async getBalance(asset: string): Promise<Balance | null> {
    const balances = await this.getBalances();
    return balances.find(b => b.asset === asset) || null;
  }
  
  async createOrder(params: OrderParams): Promise<OrderResult> {
    const normalized = this.normalizeSymbol(params.symbol);
    const orderParams: Record<string, unknown> = {
      symbol: normalized,
      side: params.side,
      type: params.type,
      quantity: params.amount,
    };
    
    if (params.type !== 'MARKET') {
      orderParams.price = params.price;
    }
    if (params.stopPrice) {
      orderParams.stopPrice = params.stopPrice;
    }
    if (params.reduceOnly) {
      orderParams.reduceOnly = 'true';
    }
    if (params.postOnly) {
      orderParams.postOnly = 'true';
    }
    if (params.timeInForce) {
      orderParams.timeInForce = params.timeInForce;
    }
    if (params.clientOrderId) {
      orderParams.newClientOrderId = params.clientOrderId;
    }
    
    const data = await this.request<any>('POST', '/fapi/v1/order', orderParams, true);
    
    return {
      id: data.orderId.toString(),
      clientOrderId: data.clientOrderId,
      symbol: params.symbol,
      side: params.side,
      type: params.type,
      price: parseFloat(data.price || '0'),
      amount: params.amount,
      filledAmount: parseFloat(data.executedQty),
      status: this.mapOrderStatus(data.status),
      fee: 0,
      feeAsset: params.symbol.split('/')[1],
      timestamp: data.transactTime,
    };
  }
  
  async cancelOrder(orderId: string, symbol: string): Promise<void> {
    const normalized = this.normalizeSymbol(symbol);
    await this.request('DELETE', '/fapi/v1/order', { symbol: this.normalizeSymbol(symbol), orderId }, true);
  }
  
  async cancelAllOrders(symbol?: string): Promise<void> {
    const params: Record<string, unknown> = {};
    if (symbol) {
      params.symbol = this.normalizeSymbol(symbol);
    }
    await this.request('DELETE', '/fapi/v1/allOpenOrders', params, true);
  }
  
  async getOrder(orderId: string, symbol: string): Promise<OrderResult> {
    const normalized = this.normalizeSymbol(symbol);
    const data = await this.request<any>('GET', '/fapi/v1/order', { symbol: this.normalizeSymbol(symbol), orderId }, true);
    
    return {
      id: data.orderId.toString(),
      clientOrderId: data.clientOrderId,
      symbol: this.denormalizeSymbol(symbol),
      side: data.side,
      type: data.type,
      price: parseFloat(data.price),
      amount: parseFloat(data.origQty),
      filledAmount: parseFloat(data.executedQty),
      status: this.mapOrderStatus(data.status),
      fee: parseFloat(data.commission || '0'),
      feeAsset: data.commissionAsset || symbol.split('/')[1],
      timestamp: data.time,
    };
  }
  
  async getOpenOrders(symbol?: string): Promise<OrderResult[]> {
    const params: Record<string, unknown> = {};
    if (symbol) {
      params.symbol = this.normalizeSymbol(symbol);
    }
    const data = await this.request<any[]>('GET', '/fapi/v1/openOrders', params, true);
    
    return data.map(o => ({
      id: o.orderId.toString(),
      clientOrderId: o.clientOrderId,
      symbol: this.denormalizeSymbol(o.symbol),
      side: o.side,
      type: o.type,
      price: parseFloat(o.price),
      amount: parseFloat(o.origQty),
      filledAmount: parseFloat(o.executedQty),
      status: this.mapOrderStatus(o.status),
      fee: 0,
      feeAsset: o.symbol.slice(-4),
      timestamp: o.time,
    }));
  }
  
  async getOrderHistory(symbol: string, limit = 100): Promise<OrderResult[]> {
    const normalized = this.normalizeSymbol(symbol);
    const data = await this.request<any[]>('GET', '/fapi/v1/allOrders', { symbol: normalized, limit }, true);
    
    return data.map(o => ({
      id: o.orderId.toString(),
      clientOrderId: o.clientOrderId,
      symbol,
      side: o.side,
      type: o.type,
      price: parseFloat(o.price),
      amount: parseFloat(o.origQty),
      filledAmount: parseFloat(o.executedQty),
      status: this.mapOrderStatus(o.status),
      fee: parseFloat(o.commission || '0'),
      feeAsset: o.commissionAsset || symbol.split('/')[1],
      timestamp: o.time,
    }));
  }
  
  async getPositions(): Promise<PositionInfo[]> {
    const data = await this.request<any[]>('GET', '/fapi/v2/positionRisk', {}, true);
    
    return data
      .filter(p => parseFloat(p.positionAmt) !== 0)
      .map(p => ({
        id: `${p.symbol}-${p.positionSide}`,
        symbol: this.denormalizeSymbol(p.symbol),
        side: p.positionSide === 'LONG' ? 'LONG' : 'SHORT',
        entryPrice: parseFloat(p.entryPrice),
        currentPrice: parseFloat(p.markPrice),
        size: Math.abs(parseFloat(p.positionAmt)),
        value: Math.abs(parseFloat(p.notional)),
        leverage: parseInt(p.leverage),
        margin: parseFloat(p.isolatedMargin),
        unrealizedPnl: parseFloat(p.unRealizedProfit),
        realizedPnl: 0,
        stopLoss: parseFloat(p.stopLossPrice) || undefined,
        takeProfit: parseFloat(p.takeProfitPrice) || undefined,
        liquidationPrice: parseFloat(p.liquidationPrice) || undefined,
        status: 'OPEN',
        timestamp: Date.now(),
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
    await this.request('POST', '/fapi/v1/leverage', { symbol: normalized, leverage }, true);
  }
  
  async setMarginType(symbol: string, marginType: 'ISOLATED' | 'CROSSED'): Promise<void> {
    const normalized = this.normalizeSymbol(symbol);
    await this.request('POST', '/fapi/v1/marginType', { symbol: normalized, marginType }, true);
  }
  
  subscribeTicker(symbol: string, callback: (ticker: Ticker) => void): () => void {
    const normalized = this.normalizeSymbol(symbol).toLowerCase();
    const ws = new WebSocket(`${this.wsUrl}/${normalized}@ticker`);
    this.wsConnections.set(`ticker-${symbol}`, ws);
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.e === '24hrTicker') {
          callback({
            symbol,
            baseAsset: symbol.split('/')[0],
            quoteAsset: symbol.split('/')[1],
            price: parseFloat(msg.c),
            priceChange24h: parseFloat(msg.p),
            priceChangePercent24h: parseFloat(msg.P),
            volume24h: parseFloat(msg.v),
            volumeUsd24h: parseFloat(msg.q),
            high24h: parseFloat(msg.h),
            low24h: parseFloat(msg.l),
            bid: parseFloat(msg.b),
            ask: parseFloat(msg.a),
            bidSize: parseFloat(msg.B),
            askSize: parseFloat(msg.A),
            timestamp: msg.E,
          });
        }
      } catch (e) {
        console.error('Binance ticker parse error:', e);
      }
    });
    
    return () => {
      ws.close();
      this.wsConnections.delete(`ticker-${symbol}`);
    };
  }
  
  subscribeCandles(symbol: string, timeframe: Timeframe, callback: (candle: Candle) => void): () => void {
    const normalized = this.normalizeSymbol(symbol).toLowerCase();
    const interval = TIMEFRAME_MAP[timeframe];
    const ws = new WebSocket(`${this.wsUrl}/${normalized}@kline_${interval}`);
    this.wsConnections.set(`candle-${symbol}-${timeframe}`, ws);
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.e === 'kline') {
          const k = msg.k;
          callback({
            timestamp: k.t,
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
            quoteVolume: parseFloat(k.q),
            tradesCount: k.n,
          });
        }
      } catch (e) {
        console.error('Binance candle parse error:', e);
      }
    });
    
    return () => {
      ws.close();
      this.wsConnections.delete(`candle-${symbol}-${timeframe}`);
    };
  }
  
  subscribeOrderBook(symbol: string, callback: (orderBook: OrderBook) => void): () => void {
    const normalized = this.normalizeSymbol(symbol).toLowerCase();
    const ws = new WebSocket(`${this.wsUrl}/${normalized}@depth20@100ms`);
    this.wsConnections.set(`orderbook-${symbol}`, ws);
    
    let lastUpdateId = 0;
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.u > lastUpdateId) {
          lastUpdateId = msg.u;
          callback({
            symbol,
            bids: msg.b.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
            asks: msg.a.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]),
            timestamp: msg.E,
          });
        }
      } catch (e) {
        console.error('Binance orderbook parse error:', e);
      }
    });
    
    return () => {
      ws.close();
      this.wsConnections.delete(`orderbook-${symbol}`);
    };
  }
  
  subscribeTrades(symbol: string, callback: (trade: { price: number; amount: number; side: 'BUY' | 'SELL'; timestamp: number }) => void): () => void {
    const normalized = this.normalizeSymbol(symbol).toLowerCase();
    const ws = new WebSocket(`${this.wsUrl}/${normalized}@trade`);
    this.wsConnections.set(`trades-${symbol}`, ws);
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.e === 'trade') {
          callback({
            price: parseFloat(msg.p),
            amount: parseFloat(msg.q),
            side: msg.m ? 'SELL' : 'BUY',
            timestamp: msg.T,
          });
        }
      } catch (e) {
        console.error('Binance trade parse error:', e);
      }
    });
    
    return () => {
      ws.close();
      this.wsConnections.delete(`trades-${symbol}`);
    };
  }
  
  private mapOrderStatus(status: string): OrderResult['status'] {
    const statusMap: Record<string, OrderResult['status']> = {
      NEW: 'OPEN',
      PARTIALLY_FILLED: 'PARTIALLY_FILLED',
      FILLED: 'FILLED',
      CANCELED: 'CANCELLED',
      REJECTED: 'FAILED',
      EXPIRED: 'CANCELLED',
    };
    return statusMap[status] || 'PENDING';
  }
}