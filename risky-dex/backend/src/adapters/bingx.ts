import crypto from 'crypto';
import type { WebSocket } from 'ws';
import { BaseExchangeAdapter, type ExchangeCredentials } from './base';
import type { Ticker, Candle, OrderBook, Balance, OrderParams, OrderResult, PositionInfo, FundingRate, OpenInterest, Timeframe } from '@risky-dex/shared';
import { config } from '../config';

const TIMEFRAME_MAP: Record<Timeframe, string> = {
  '1m': '15m',
  '5m': '30m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
  '1w': '1w',
};

export class BingXAdapter extends BaseExchangeAdapter {
  readonly name = 'BINGX' as const;
  readonly baseUrl = config.exchanges.bingx.baseUrl;
  readonly wsUrl = config.exchanges.bingx.wsUrl;
  
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
      'X-BX-APIKEY': this.credentials.apiKey,
    };
  }
  
  normalizeSymbol(symbol: string): string {
    return symbol.replace('/', '-').toUpperCase();
  }
  
  denormalizeSymbol(symbol: string): string {
    return symbol.replace('-', '/');
  }
  
  async getServerTime(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/openApi/swap/v2/server/time`);
    const data = await response.json();
    return parseInt(data.data);
  }
  
  async getTicker(symbol: string): Promise<Ticker> {
    const normalized = this.normalizeSymbol(symbol);
    const response = await fetch(`${this.baseUrl}/openApi/swap/v2/quote/ticker?symbol=${normalized}`);
    const data = await response.json();
    const t = data.data;
    
    return {
      symbol,
      baseAsset: symbol.split('/')[0],
      quoteAsset: symbol.split('/')[1],
      price: parseFloat(t.lastPrice),
      priceChange24h: parseFloat(t.priceChange),
      priceChangePercent24h: parseFloat(t.priceChangePercent),
      volume24h: parseFloat(t.volume),
      volumeUsd24h: parseFloat(t.quoteVolume),
      high24h: parseFloat(t.highPrice),
      low24h: parseFloat(t.lowPrice),
      bid: parseFloat(t.bidPrice),
      ask: parseFloat(t.askPrice),
      bidSize: parseFloat(t.bidQty),
      askSize: parseFloat(t.askQty),
      timestamp: parseInt(t.time),
    };
  }
  
  async getTickers(symbols?: string[]): Promise<Ticker[]> {
    const response = await fetch(`${this.baseUrl}/openApi/swap/v2/quote/tickers`);
    const data = await response.json();
    
    let tickers = data.data;
    if (symbols && symbols.length > 0) {
      const normalizedSymbols = new Set(symbols.map(s => this.normalizeSymbol(s)));
      tickers = tickers.filter((t: any) => normalizedSymbols.has(t.symbol));
    }
    
    return tickers.map((t: any) => ({
      symbol: this.denormalizeSymbol(t.symbol),
      baseAsset: t.symbol.split('-')[0],
      quoteAsset: t.symbol.split('-')[1],
      price: parseFloat(t.lastPrice),
      priceChange24h: parseFloat(t.priceChange),
      priceChangePercent24h: parseFloat(t.priceChangePercent),
      volume24h: parseFloat(t.volume),
      volumeUsd24h: parseFloat(t.quoteVolume),
      high24h: parseFloat(t.highPrice),
      low24h: parseFloat(t.lowPrice),
      bid: parseFloat(t.bidPrice),
      ask: parseFloat(t.askPrice),
      bidSize: parseFloat(t.bidQty),
      askSize: parseFloat(t.askQty),
      timestamp: parseInt(t.time),
    }));
  }
  
  async getCandles(symbol: string, timeframe: Timeframe, limit = 500): Promise<Candle[]> {
    const normalized = this.normalizeSymbol(symbol);
    const interval = TIMEFRAME_MAP[timeframe];
    const response = await fetch(`${this.baseUrl}/openApi/swap/v2/quote/klines?symbol=${normalized}&interval=${interval}&limit=${limit}`);
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
    }));
  }
  
  async getOrderBook(symbol: string, limit = 100): Promise<OrderBook> {
    const normalized = this.normalizeSymbol(symbol);
    const response = await fetch(`${this.baseUrl}/openApi/swap/v2/quote/depth?symbol=${normalized}&limit=${limit}`);
    const data = await response.json();
    const d = data.data;
    
    return {
      symbol,
      bids: d.bids.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
      asks: d.asks.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]),
      timestamp: parseInt(d.time),
    };
  }
  
  async getFundingRate(symbol: string): Promise<FundingRate> {
    const normalized = this.normalizeSymbol(symbol);
    const response = await fetch(`${this.baseUrl}/openApi/swap/v2/quote/fundingRate?symbol=${normalized}`);
    const data = await response.json();
    const f = data.data;
    
    return {
      symbol,
      rate: parseFloat(f.fundingRate),
      nextFundingTime: parseInt(f.nextFundingTime),
      timestamp: Date.now(),
    };
  }
  
  async getOpenInterest(symbol: string): Promise<OpenInterest> {
    const normalized = this.normalizeSymbol(symbol);
    const response = await fetch(`${this.baseUrl}/openApi/swap/v2/quote/openInterest?symbol=${normalized}`);
    const data = await response.json();
    const oi = data.data;
    
    return {
      symbol,
      value: parseFloat(oi.openInterest),
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
    throw new Error('BingX trading not implemented yet');
  }
  
  async cancelOrder(orderId: string, symbol: string): Promise<void> {
    throw new Error('BingX trading not implemented yet');
  }
  
  async cancelAllOrders(symbol?: string): Promise<void> {
    throw new Error('BingX trading not implemented yet');
  }
  
  async getOrder(orderId: string, symbol: string): Promise<OrderResult> {
    throw new Error('BingX trading not implemented yet');
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
    throw new Error('BingX trading not implemented yet');
  }
  
  async setLeverage(symbol: string, leverage: number): Promise<void> {
    throw new Error('BingX trading not implemented yet');
  }
  
  async setMarginType(symbol: string, marginType: 'ISOLATED' | 'CROSSED'): Promise<void> {
    throw new Error('BingX trading not implemented yet');
  }
  
  subscribeTicker(symbol: string, callback: (ticker: Ticker) => void): () => void {
    const normalized = this.normalizeSymbol(symbol);
    const ws = new WebSocket(this.wsUrl);
    this.wsConnections.set(`ticker-${symbol}`, ws);
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        id: `ticker-${symbol}`,
        reqType: 'sub',
        dataType: `ticker@${normalized}`,
      }));
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.dataType === `ticker@${normalized}` && msg.data) {
          const t = msg.data;
          callback({
            symbol,
            baseAsset: symbol.split('/')[0],
            quoteAsset: symbol.split('/')[1],
            price: parseFloat(t.lastPrice),
            priceChange24h: parseFloat(t.priceChange),
            priceChangePercent24h: parseFloat(t.priceChangePercent),
            volume24h: parseFloat(t.volume),
            volumeUsd24h: parseFloat(t.quoteVolume),
            high24h: parseFloat(t.highPrice),
            low24h: parseFloat(t.lowPrice),
            bid: parseFloat(t.bidPrice),
            ask: parseFloat(t.askPrice),
            bidSize: parseFloat(t.bidQty),
            askSize: parseFloat(t.askQty),
            timestamp: parseInt(t.time),
          });
        }
      } catch (e) {
        console.error('BingX ticker parse error:', e);
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
        id: `candle-${symbol}-${timeframe}`,
        reqType: 'sub',
        dataType: `kline_${interval}@${normalized}`,
      }));
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.dataType === `kline_${interval}@${normalized}` && msg.data) {
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
        console.error('BingX candle parse error:', e);
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
        id: `orderbook-${symbol}`,
        reqType: 'sub',
        dataType: `depth@${normalized}`,
      }));
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.dataType === `depth@${normalized}` && msg.data) {
          const d = msg.data;
          callback({
            symbol,
            bids: d.bids.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
            asks: d.asks.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]),
            timestamp: parseInt(d.time),
          });
        }
      } catch (e) {
        console.error('BingX orderbook parse error:', e);
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
        id: `trades-${symbol}`,
        reqType: 'sub',
        dataType: `trade@${normalized}`,
      }));
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.dataType === `trade@${normalized}` && msg.data) {
          for (const t of msg.data) {
            callback({
              price: parseFloat(t.price),
              amount: parseFloat(t.quantity),
              side: t.side === 'buy' ? 'BUY' : 'SELL',
              timestamp: parseInt(t.time),
            });
          }
        }
      } catch (e) {
        console.error('BingX trade parse error:', e);
      }
    });
    
    return () => {
      ws.close();
      this.wsConnections.delete(`trades-${symbol}`);
    };
  }
}