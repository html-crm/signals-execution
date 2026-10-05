import type { WebSocket } from 'ws';
import type {
  ExchangeName,
  Ticker,
  Candle,
  OrderBook,
  Balance,
  OrderParams,
  OrderResult,
  PositionInfo,
  FundingRate,
  OpenInterest,
  Timeframe,
} from '@risky-dex/shared';

export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  testnet?: boolean;
}

export interface ExchangeAdapter {
  readonly name: ExchangeName;
  readonly baseUrl: string;
  readonly wsUrl: string;
  
  // Market Data
  getTicker(symbol: string): Promise<Ticker>;
  getTickers(symbols?: string[]): Promise<Ticker[]>;
  getCandles(symbol: string, timeframe: Timeframe, limit: number): Promise<Candle[]>;
  getOrderBook(symbol: string, limit?: number): Promise<OrderBook>;
  getFundingRate(symbol: string): Promise<FundingRate>;
  getOpenInterest(symbol: string): Promise<OpenInterest>;
  get24hStats(symbol: string): Promise<{ volume24h: number; priceChange24h: number; priceChangePercent24h: number }>;
  
  // Account
  getBalances(): Promise<Balance[]>;
  getBalance(asset: string): Promise<Balance | null>;
  
  // Trading
  createOrder(params: OrderParams): Promise<OrderResult>;
  cancelOrder(orderId: string, symbol: string): Promise<void>;
  cancelAllOrders(symbol?: string): Promise<void>;
  getOrder(orderId: string, symbol: string): Promise<OrderResult>;
  getOpenOrders(symbol?: string): Promise<OrderResult[]>;
  getOrderHistory(symbol: string, limit?: number): Promise<OrderResult[]>;
  
  // Positions
  getPositions(): Promise<PositionInfo[]>;
  getPosition(symbol: string): Promise<PositionInfo | null>;
  closePosition(symbol: string, percentage?: number): Promise<OrderResult>;
  setLeverage(symbol: string, leverage: number): Promise<void>;
  setMarginType(symbol: string, marginType: 'ISOLATED' | 'CROSSED'): Promise<void>;
  
  // WebSocket
  subscribeTicker(symbol: string, callback: (ticker: Ticker) => void): () => void;
  subscribeCandles(symbol: string, timeframe: Timeframe, callback: (candle: Candle) => void): () => void;
  subscribeOrderBook(symbol: string, callback: (orderBook: OrderBook) => void): () => void;
  subscribeTrades(symbol: string, callback: (trade: { price: number; amount: number; side: 'BUY' | 'SELL'; timestamp: number }) => void): () => void;
  
  // Utility
  normalizeSymbol(symbol: string): string;
  denormalizeSymbol(symbol: string): string;
  getServerTime(): Promise<number>;
  ping(): Promise<boolean>;
}

export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  testnet?: boolean;
}

export abstract class BaseExchangeAdapter implements ExchangeAdapter {
  abstract readonly name: ExchangeName;
  abstract readonly baseUrl: string;
  abstract readonly wsUrl: string;
  
  protected credentials: ExchangeCredentials;
  protected wsConnections: Map<string, WebSocket> = new Map();
  
  constructor(credentials: ExchangeCredentials) {
    this.credentials = credentials;
  }
  
  protected abstract signRequest(params: Record<string, unknown>): string;
  protected abstract getHeaders(): Record<string, string>;
  
  protected async request<T>(
    method: 'GET' | 'POST' | 'DELETE' | 'PUT',
    endpoint: string,
    params: Record<string, unknown> = {},
    signed = false
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();
    
    let queryString = '';
    let body: string | undefined;
    
    if (signed) {
      params.timestamp = await this.getServerTime();
      params.recvWindow = 5000;
      const signature = this.signRequest(params);
      params.signature = signature;
    }
    
    if (method === 'GET' || method === 'DELETE') {
      queryString = new URLSearchParams(params as Record<string, string>).toString();
    } else {
      body = JSON.stringify(params);
      headers['Content-Type'] = 'application/json';
    }
    
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    
    const response = await fetch(fullUrl, {
      method,
      headers,
      body,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`${this.name} API Error: ${response.status} - ${error}`);
    }
    
    return response.json();
  }
  
  abstract getTicker(symbol: string): Promise<Ticker>;
  abstract getTickers(symbols?: string[]): Promise<Ticker[]>;
  abstract getCandles(symbol: string, timeframe: Timeframe, limit: number): Promise<Candle[]>;
  abstract getOrderBook(symbol: string, limit?: number): Promise<OrderBook>;
  abstract getFundingRate(symbol: string): Promise<FundingRate>;
  abstract getOpenInterest(symbol: string): Promise<OpenInterest>;
  abstract get24hStats(symbol: string): Promise<{ volume24h: number; priceChange24h: number; priceChangePercent24h: number }>;
  
  abstract getBalances(): Promise<Balance[]>;
  abstract getBalance(asset: string): Promise<Balance | null>;
  
  abstract createOrder(params: OrderParams): Promise<OrderResult>;
  abstract cancelOrder(orderId: string, symbol: string): Promise<void>;
  abstract cancelAllOrders(symbol?: string): Promise<void>;
  abstract getOrder(orderId: string, symbol: string): Promise<OrderResult>;
  abstract getOpenOrders(symbol?: string): Promise<OrderResult[]>;
  abstract getOrderHistory(symbol: string, limit?: number): Promise<OrderResult[]>;
  
  abstract getPositions(): Promise<PositionInfo[]>;
  abstract getPosition(symbol: string): Promise<PositionInfo | null>;
  abstract closePosition(symbol: string, percentage?: number): Promise<OrderResult>;
  abstract setLeverage(symbol: string, leverage: number): Promise<void>;
  abstract setMarginType(symbol: string, marginType: 'ISOLATED' | 'CROSSED'): Promise<void>;
  
  abstract subscribeTicker(symbol: string, callback: (ticker: Ticker) => void): () => void;
  abstract subscribeCandles(symbol: string, timeframe: Timeframe, callback: (candle: Candle) => void): () => void;
  abstract subscribeOrderBook(symbol: string, callback: (orderBook: OrderBook) => void): () => void;
  abstract subscribeTrades(symbol: string, callback: (trade: { price: number; amount: number; side: 'BUY' | 'SELL'; timestamp: number }) => void): () => void;
  
  abstract normalizeSymbol(symbol: string): string;
  abstract denormalizeSymbol(symbol: string): string;
  
  async getServerTime(): Promise<number> {
    return Date.now();
  }
  
  async ping(): Promise<boolean> {
    try {
      await this.getServerTime();
      return true;
    } catch {
      return false;
    }
  }
  
  protected createWsConnection(url: string): WebSocket {
    const ws = new WebSocket(url);
    return ws;
  }
  
  closeAllConnections(): void {
    for (const [key, ws] of this.wsConnections) {
      ws.close();
    }
    this.wsConnections.clear();
  }
}