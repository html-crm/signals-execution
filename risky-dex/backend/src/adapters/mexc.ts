import crypto from 'crypto';
import type { WebSocket } from 'ws';
import { BaseExchangeAdapter, type ExchangeCredentials } from './base';
import type { Ticker, Candle, OrderBook, Balance, OrderParams, OrderResult, PositionInfo, FundingRate, OpenInterest, Timeframe } from '@risky-dex/shared';
import { config } from '../config';

const TIMEFRAME_MAP: Record<Timeframe, string> = {
  '1m': 'Min15',
  '5m': 'Min30',
  '15m': 'Min15',
  '30m': 'Min30',
  '1h': 'Min60',
  '4h': 'Hour4',
  '1d': 'Day1',
  '1w': 'Week1',
};

export class MEXCAdapter extends BaseExchangeAdapter {
  readonly name = 'MEXC' as const;
  readonly baseUrl = config.exchanges.mexc.baseUrl;
  readonly wsUrl = config.exchanges.mexc.wsUrl;
  
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
      'X-MEXC-APIKEY': this.credentials.apiKey,
    };
  }
  
  normalizeSymbol(symbol: string): string {
    return symbol.replace('/', '_').toUpperCase();
  }
  
  denormalizeSymbol(symbol: string): string {
    return symbol.replace('_', '/');
  }
  
  async getServerTime(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/api/v3/time`);
    const data = await response.json();
    return data.serverTime;
  }
  
  async getTicker(symbol: string): Promise<Ticker> {
    const normalized = this.normalizeSymbol(symbol);
    const [ticker24h, bookTicker] = await Promise.all([
      this.request<any>('GET', '/api/v3/ticker/24hr', { symbol: normalized }),
      this.request<any>('GET', '/api/v3/ticker/bookTicker', { symbol: normalized }),
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
    const data = await this.request<any[]>('GET', '/api/v3/ticker/24hr');
    const bookTickers = await this.request<any[]>('GET', '/api/v3/ticker/bookTicker');
    const bookTickerMap = new Map(bookTickers.map(t => [t.symbol, t]));
    
    let tickers = data;
    if (symbols && symbols.length > 0) {
      const normalizedSymbols = new Set(symbols.map(s => this.normalizeSymbol(s)));
      tickers = tickers.filter(t => normalizedSymbols.has(t.symbol));
    }
    
    return tickers.map(t => {
      const bt = bookTickerMap.get(t.symbol);
      return {
        symbol: this.denormalizeSymbol(t.symbol),
        baseAsset: t.symbol.split('_')[0],
        quoteAsset: t.symbol.split('_')[1],
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
      });
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
    const data = await this.request<any>('GET', '/api/v3/depth', {
      symbol: normalized,
      limit,
    });
    
    return {
      symbol,
      bids: data.bids.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
      asks: data.asks.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]),
      timestamp: Date.now(),
    };
  }
  
  async getFundingRate(symbol: string): Promise<FundingRate> {
    const normalized = this.normalizeSymbol(symbol);
    const data = await this.request<any>('GET', '/api/v3/fundingRate', { symbol: normalized });
    
    return {
      symbol,
      rate: parseFloat(data.fundingRate),
      nextFundingTime: parseInt(data.nextFundingTime),
      timestamp: Date.now(),
    };
  }
  
  async getOpenInterest(symbol: string): Promise<OpenInterest> {
    const normalized = this.normalizeSymbol(symbol);
    const data = await this.request<any>('GET', '/api/v3/openInterest', { symbol: normalized });
    
    return {
      symbol,
      value: parseFloat(data.openInterest),
      timestamp: Date.now(),
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
    return [];
  }
  
  async getBalance(asset: string): Promise<Balance | null> {
    return null;
  }
  
  async createOrder(params: OrderParams): Promise<OrderResult> {
    throw new Error('MEXC trading not implemented yet');
  }
  
  async cancelOrder(orderId: string, symbol: string): Promise<void> {
    throw new Error('MEXC trading not implemented yet');
  }
  
  async cancelAllOrders(symbol?: string): Promise<void> {
    throw new Error('MEXC trading not implemented yet');
  }
  
  async getOrder(orderId: string, symbol: string): Promise<OrderResult> {
    throw new Error('MEXC trading not implemented yet');
  }
  
  async getOpenOrders(symbol?: string): Promise<OrderResult[]> {
    return [];
  }
  
  async getOrderHistory(symbol: string, limit = 100): Promise<OrderResult[]> {
    return [];
  }
  
  async getPositions(): Promise<PositionInfo[]> {
    return [];
  }
  
  async getPosition(symbol: string): Promise<PositionInfo | null> {
    return null;
  }
  
  async closePosition(symbol: string, percentage?: number): Promise<OrderResult> {
    throw new Error('MEXC trading not implemented yet');
  }
  
  async setLeverage(symbol: string, leverage: number): Promise<void> {
    throw new Error('MEXC trading not implemented yet');
  }
  
  async setMarginType(symbol: string, marginType: 'ISOLATED' | 'CROSSED'): Promise<void> {
    throw new Error('MEXC trading not implemented yet');
  }
  
  subscribeTicker(symbol: string, callback: (ticker: Ticker) => void): () => void {
    const normalized = this.normalizeSymbol(symbol).toLowerCase();
    const ws = new WebSocket(this.wsUrl);
    this.wsConnections.set(`ticker-${symbol}`, ws);
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        method: 'SUBSCRIPTION',
        params: [`spot@ticker@${normalized}`],
      }));
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.c === 'spot@ticker' && msg.d) {
          const t = msg.d;
          callback({
            symbol,
            baseAsset: symbol.split('/')[0],
            quoteAsset: symbol.split('/')[1],
            price: parseFloat(t.c),
            priceChange24h: parseFloat(t.p),
            priceChangePercent24h: parseFloat(t.P),
            volume24h: parseFloat(t.v),
            volumeUsd24h: parseFloat(t.q),
            high24h: parseFloat(t.h),
            low24h: parseFloat(t.l),
            bid: parseFloat(t.b),
            ask: parseFloat(t.a),
            bidSize: parseFloat(t.B),
            askSize: parseFloat(t.A),
            timestamp: msg.T,
          });
        }
      } catch (e) {
        console.error('MEXC ticker parse error:', e);
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
    const ws = new WebSocket(this.wsUrl);
    this.wsConnections.set(`candle-${symbol}-${timeframe}`, ws);
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        method: 'SUBSCRIPTION',
        params: [`spot@kline.${interval}@${normalized}`],
      }));
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.c?.startsWith('spot@kline') && msg.d) {
          const k = msg.d;
          callback({
            timestamp: k.t,
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
            quoteVolume: parseFloat(k.q),
            tradesCount: 0,
          });
        }
      } catch (e) {
        console.error('MEXC candle parse error:', e);
      }
    });
    
    return () => {
      ws.close();
      this.wsConnections.delete(`candle-${symbol}-${timeframe}`);
    };
  }
  
  subscribeOrderBook(symbol: string, callback: (orderBook: OrderBook) => void): () => void {
    const normalized = this.normalizeSymbol(symbol).toLowerCase();
    const ws = new WebSocket(this.wsUrl);
    this.wsConnections.set(`orderbook-${symbol}`, ws);
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        method: 'SUBSCRIPTION',
        params: [`spot@depth20@${normalized}`],
      }));
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.c === 'spot@depth' && msg.d) {
          const d = msg.d;
          callback({
            symbol,
            bids: d.b.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
            asks: d.a.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]),
            timestamp: msg.T,
          });
        }
      } catch (e) {
        console.error('MEXC orderbook parse error:', e);
      }
    });
    
    return () => {
      ws.close();
      this.wsConnections.delete(`orderbook-${symbol}`);
    };
  }
  
  subscribeTrades(symbol: string, callback: (trade: { price: number; amount: number; side: 'BUY' | 'SELL'; timestamp: number }) => void): () => void {
    const normalized = this.normalizeSymbol(symbol).toLowerCase();
    const ws = new WebSocket(this.wsUrl);
    this.wsConnections.set(`trades-${symbol}`, ws);
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        method: 'SUBSCRIPTION',
        params: [`spot@trade@${normalized}`],
      }));
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.c === 'spot@trade' && msg.d) {
          for (const t of msg.d) {
            callback({
              price: parseFloat(t.p),
              amount: parseFloat(t.v),
              side: t.S === 1 ? 'BUY' : 'SELL',
              timestamp: t.T,
            });
          }
        }
      } catch (e) {
        console.error('MEXC trade parse error:', e);
      }
    });
    
    return () => {
      ws.close();
      this.wsConnections.delete(`trades-${symbol}`);
    };
  }
}