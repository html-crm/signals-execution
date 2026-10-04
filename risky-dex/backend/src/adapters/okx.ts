import crypto from 'crypto';
import WebSocket from 'ws';
import { BaseExchangeAdapter, type ExchangeCredentials } from './base';
import type { Ticker, Candle, OrderBook, Balance, OrderParams, OrderResult, PositionInfo, FundingRate, OpenInterest, Timeframe } from '../types';
import { config } from '../config';

const TIMEFRAME_MAP: Record<Timeframe, string> = {
  M15: '15m',
  M30: '30m',
  H1: '1H',
  H4: '4H',
  D1: '1D',
  W1: '1W',
};

export class OKXAdapter extends BaseExchangeAdapter {
  readonly name = 'OKX' as const;
  readonly baseUrl = config.exchanges.okx.baseUrl;
  readonly wsUrl = config.exchanges.okx.wsUrl;
  
  constructor(credentials: ExchangeCredentials) {
    super(credentials);
  }
  
  protected signRequest(params: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const method = 'GET';
    const requestPath = '/api/v5/market/ticker';
    const body = '';
    const message = timestamp + method + requestPath + body;
    return crypto
      .createHmac('sha256', this.credentials.apiSecret)
      .update(message)
      .digest('base64');
  }
  
  protected getHeaders(): Record<string, string> {
    const timestamp = new Date().toISOString();
    return {
      'OK-ACCESS-KEY': this.credentials.apiKey,
      'OK-ACCESS-SIGN': this.signRequest({}),
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': this.credentials.passphrase || '',
      'Content-Type': 'application/json',
    };
  }
  
  normalizeSymbol(symbol: string): string {
    return symbol.replace('/', '-').toUpperCase();
  }
  
  denormalizeSymbol(symbol: string): string {
    return symbol.replace('-', '/');
  }
  
  async getServerTime(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/api/v5/public/time`);
    const data = await response.json() as { data: Array<{ ts: string }> };
    return parseInt(data.data[0].ts);
  }
  
  async getTicker(symbol: string): Promise<Ticker> {
    const normalized = this.normalizeSymbol(symbol);
    const response = await fetch(`${this.baseUrl}/api/v5/market/ticker?instId=${normalized}`);
    const data = await response.json();
    const t = data.data[0];
    
    return {
      symbol,
      baseAsset: symbol.split('/')[0],
      quoteAsset: symbol.split('/')[1],
      price: parseFloat(t.last),
      priceChange24h: parseFloat(t.open24h) - parseFloat(t.last),
      priceChangePercent24h: ((parseFloat(t.last) - parseFloat(t.open24h)) / parseFloat(t.open24h)) * 100,
      volume24h: parseFloat(t.volCcy24h),
      volumeUsd24h: parseFloat(t.volCcy24h) * parseFloat(t.last),
      high24h: parseFloat(t.high24h),
      low24h: parseFloat(t.low24h),
      bid: parseFloat(t.bidPx),
      ask: parseFloat(t.askPx),
      bidSize: parseFloat(t.bidSz),
      askSize: parseFloat(t.askSz),
      timestamp: parseInt(t.ts),
    };
  }
  
  async getTickers(symbols?: string[]): Promise<Ticker[]> {
    const response = await fetch(`${this.baseUrl}/api/v5/market/tickers?instType=SWAP`);
    const data = await response.json();
    
    let tickers = data.data;
    if (symbols && symbols.length > 0) {
      const normalizedSymbols = new Set(symbols.map(s => this.normalizeSymbol(s)));
      tickers = tickers.filter((t: any) => normalizedSymbols.has(t.instId));
    }
    
    return tickers.map((t: any) => ({
      symbol: this.denormalizeSymbol(t.instId),
      baseAsset: t.instId.split('-')[0],
      quoteAsset: t.instId.split('-')[1],
      price: parseFloat(t.last),
      priceChange24h: parseFloat(t.open24h) - parseFloat(t.last),
      priceChangePercent24h: ((parseFloat(t.last) - parseFloat(t.open24h)) / parseFloat(t.open24h)) * 100,
      volume24h: parseFloat(t.volCcy24h),
      volumeUsd24h: parseFloat(t.volCcy24h) * parseFloat(t.last),
      high24h: parseFloat(t.high24h),
      low24h: parseFloat(t.low24h),
      bid: parseFloat(t.bidPx),
      ask: parseFloat(t.askPx),
      bidSize: parseFloat(t.bidSz),
      askSize: parseFloat(t.askSz),
      timestamp: parseInt(t.ts),
    }));
  }
  
  async getCandles(symbol: string, timeframe: Timeframe, limit = 500): Promise<Candle[]> {
    const normalized = this.normalizeSymbol(symbol);
    const interval = TIMEFRAME_MAP[timeframe];
    const response = await fetch(`${this.baseUrl}/api/v5/market/candles?instId=${normalized}&bar=${interval}&limit=${limit}`);
    const data = await response.json();
    
    return data.data.map((c: any) => ({
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
    const response = await fetch(`${this.baseUrl}/api/v5/market/books?instId=${normalized}&sz=${limit}`);
    const data = await response.json();
    const d = data.data[0];
    
    return {
      symbol,
      bids: d.bids.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
      asks: d.asks.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]),
      timestamp: parseInt(d.ts),
    };
  }
  
  async getFundingRate(symbol: string): Promise<FundingRate> {
    const normalized = this.normalizeSymbol(symbol);
    const response = await fetch(`${this.baseUrl}/api/v5/public/funding-rate?instId=${normalized}`);
    const data = await response.json();
    const f = data.data[0];
    
    return {
      symbol,
      rate: parseFloat(f.fundingRate),
      nextFundingTime: parseInt(f.nextFundingTime),
      timestamp: parseInt(f.ts),
    };
  }
  
  async getOpenInterest(symbol: string): Promise<OpenInterest> {
    const normalized = this.normalizeSymbol(symbol);
    const response = await fetch(`${this.baseUrl}/api/v5/public/open-interest?instId=${normalized}`);
    const data = await response.json();
    const oi = data.data[0];
    
    return {
      symbol,
      value: parseFloat(oi.oi),
      timestamp: parseInt(oi.ts),
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
    // Requires signed request - implement when needed
    return [];
  }
  
  async getBalance(asset: string): Promise<Balance | null> {
    return null;
  }
  
  async createOrder(params: OrderParams): Promise<OrderResult> {
    throw new Error('OKX trading not implemented yet');
  }
  
  async cancelOrder(orderId: string, symbol: string): Promise<void> {
    throw new Error('OKX trading not implemented yet');
  }
  
  async cancelAllOrders(symbol?: string): Promise<void> {
    throw new Error('OKX trading not implemented yet');
  }
  
  async getOrder(orderId: string, symbol: string): Promise<OrderResult> {
    throw new Error('OKX trading not implemented yet');
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
    throw new Error('OKX trading not implemented yet');
  }
  
  async setLeverage(symbol: string, leverage: number): Promise<void> {
    throw new Error('OKX trading not implemented yet');
  }
  
  async setMarginType(symbol: string, marginType: 'ISOLATED' | 'CROSSED'): Promise<void> {
    throw new Error('OKX trading not implemented yet');
  }
  
  subscribeTicker(symbol: string, callback: (ticker: Ticker) => void): () => void {
    const normalized = this.normalizeSymbol(symbol);
    const ws = new WebSocket(this.wsUrl);
    this.wsConnections.set(`ticker-${symbol}`, ws);
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        op: 'subscribe',
        args: [{ channel: 'tickers', instId: normalized }],
      }));
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.arg?.channel === 'tickers' && msg.data) {
          const t = msg.data[0];
          callback({
            symbol,
            baseAsset: symbol.split('/')[0],
            quoteAsset: symbol.split('/')[1],
            price: parseFloat(t.last),
            priceChange24h: parseFloat(t.open24h) - parseFloat(t.last),
            priceChangePercent24h: ((parseFloat(t.last) - parseFloat(t.open24h)) / parseFloat(t.open24h)) * 100,
            volume24h: parseFloat(t.volCcy24h),
            volumeUsd24h: parseFloat(t.volCcy24h) * parseFloat(t.last),
            high24h: parseFloat(t.high24h),
            low24h: parseFloat(t.low24h),
            bid: parseFloat(t.bidPx),
            ask: parseFloat(t.askPx),
            bidSize: parseFloat(t.bidSz),
            askSize: parseFloat(t.askSz),
            timestamp: parseInt(t.ts),
          });
        }
      } catch (e) {
        console.error('OKX ticker parse error:', e);
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
        args: [{ channel: 'candle' + interval, instId: normalized }],
      }));
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.arg?.channel?.startsWith('candle') && msg.data) {
          for (const c of msg.data) {
            callback({
              timestamp: parseInt(c[0]),
              open: parseFloat(c[1]),
              high: parseFloat(c[2]),
              low: parseFloat(c[3]),
              close: parseFloat(c[4]),
              volume: parseFloat(c[5]),
              quoteVolume: parseFloat(c[6]),
              tradesCount: 0,
            });
          }
        }
      } catch (e) {
        console.error('OKX candle parse error:', e);
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
        args: [{ channel: 'books', instId: normalized }],
      }));
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.arg?.channel === 'books' && msg.data) {
          const d = msg.data[0];
          callback({
            symbol,
            bids: d.bids.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
            asks: d.asks.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]),
            timestamp: parseInt(d.ts),
          });
        }
      } catch (e) {
        console.error('OKX orderbook parse error:', e);
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
        args: [{ channel: 'trades', instId: normalized }],
      }));
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.arg?.channel === 'trades' && msg.data) {
          for (const t of msg.data) {
            callback({
              price: parseFloat(t.px),
              amount: parseFloat(t.sz),
              side: t.side === 'buy' ? 'BUY' : 'SELL',
              timestamp: parseInt(t.ts),
            });
          }
        }
      } catch (e) {
        console.error('OKX trade parse error:', e);
      }
    });
    
    return () => {
      ws.close();
      this.wsConnections.delete(`trades-${symbol}`);
    };
  }
}
