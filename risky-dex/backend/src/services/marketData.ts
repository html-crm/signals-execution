import { prisma } from '@utils/prisma';
import { createExchangeAdapter, type BaseExchangeAdapter } from '@adapters/index';
import type { ExchangeName, Ticker, Candle, OrderBook, Timeframe, FundingRate, OpenInterest } from '../types';
import { config } from '../config';

interface MarketDataCache {
  tickers: Map<string, { data: Ticker; timestamp: number }>;
  candles: Map<string, { data: Candle[]; timestamp: number }>;
  orderBooks: Map<string, { data: OrderBook; timestamp: number }>;
  fundingRates: Map<string, { data: FundingRate; timestamp: number }>;
  openInterest: Map<string, { data: OpenInterest; timestamp: number }>;
}

export class MarketDataService {
  private adapters: Map<ExchangeName, BaseExchangeAdapter> = new Map();
  private cache: MarketDataCache = {
    tickers: new Map(),
    candles: new Map(),
    orderBooks: new Map(),
    fundingRates: new Map(),
    openInterest: new Map(),
  };
  private wsSubscriptions: Map<string, () => void> = new Map();
  private cacheTTL = 5000;
  
  constructor() {
    this.initializeDefaultAdapters();
  }
  
  private initializeDefaultAdapters(): void {
    const exchanges: ExchangeName[] = ['BINANCE', 'BYBIT', 'OKX', 'MEXC', 'BITGET', 'BINGX'];
    
    for (const exchange of exchanges) {
      const credentials = this.getDefaultCredentials(exchange);
      if (credentials.apiKey || credentials.apiSecret) {
        try {
          const adapter = createExchangeAdapter(exchange, credentials);
          this.adapters.set(exchange, adapter);
        } catch (error) {
          console.warn(`Failed to initialize ${exchange} adapter:`, error);
        }
      }
    }
  }
  
  private getDefaultCredentials(exchange: ExchangeName): { apiKey: string; apiSecret: string; passphrase?: string } {
    const exchangeConfig = config.exchanges[exchange.toLowerCase() as keyof typeof config.exchanges];
    return {
      apiKey: exchangeConfig?.apiKey || '',
      apiSecret: exchangeConfig?.apiSecret || '',
      passphrase: exchangeConfig?.passphrase,
    };
  }
  
  private getAdapter(exchange: ExchangeName): BaseExchangeAdapter {
    let adapter = this.adapters.get(exchange);
    if (!adapter) {
      const credentials = this.getDefaultCredentials(exchange);
      adapter = createExchangeAdapter(exchange, credentials);
      this.adapters.set(exchange, adapter);
    }
    return adapter;
  }
  
  async getTicker(exchange: ExchangeName, symbol: string): Promise<Ticker> {
    const cacheKey = `${exchange}:${symbol}`;
    const cached = this.cache.tickers.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    
    const adapter = this.getAdapter(exchange);
    const ticker = await adapter.getTicker(symbol);
    
    this.cache.tickers.set(cacheKey, { data: ticker, timestamp: Date.now() });
    return ticker;
  }
  
  async getTickers(exchange: ExchangeName, symbols?: string[]): Promise<Ticker[]> {
    const adapter = this.getAdapter(exchange);
    const tickers = await adapter.getTickers(symbols);
    
    for (const ticker of tickers) {
      const cacheKey = `${exchange}:${ticker.symbol}`;
      this.cache.tickers.set(cacheKey, { data: ticker, timestamp: Date.now() });
    }
    
    return tickers;
  }
  
  async getCandles(exchange: ExchangeName, symbol: string, timeframe: Timeframe, limit = 500): Promise<Candle[]> {
    const cacheKey = `${exchange}:${symbol}:${timeframe}:${limit}`;
    const cached = this.cache.candles.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL * 2) {
      return cached.data;
    }
    
    const adapter = this.getAdapter(exchange);
    const candles = await adapter.getCandles(symbol, timeframe, limit);
    
    this.cache.candles.set(cacheKey, { data: candles, timestamp: Date.now() });
    return candles;
  }
  
  async getOrderBook(exchange: ExchangeName, symbol: string, limit = 100): Promise<OrderBook> {
    const cacheKey = `${exchange}:${symbol}:${limit}`;
    const cached = this.cache.orderBooks.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    
    const adapter = this.getAdapter(exchange);
    const orderBook = await adapter.getOrderBook(symbol, limit);
    
    this.cache.orderBooks.set(cacheKey, { data: orderBook, timestamp: Date.now() });
    return orderBook;
  }
  
  async getFundingRate(exchange: ExchangeName, symbol: string): Promise<FundingRate> {
    const cacheKey = `${exchange}:${symbol}`;
    const cached = this.cache.fundingRates.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 60000) {
      return cached.data;
    }
    
    const adapter = this.getAdapter(exchange);
    const fundingRate = await adapter.getFundingRate(symbol);
    
    this.cache.fundingRates.set(cacheKey, { data: fundingRate, timestamp: Date.now() });
    return fundingRate;
  }
  
  async getOpenInterest(exchange: ExchangeName, symbol: string): Promise<OpenInterest> {
    const cacheKey = `${exchange}:${symbol}`;
    const cached = this.cache.openInterest.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 60000) {
      return cached.data;
    }
    
    const adapter = this.getAdapter(exchange);
    const openInterest = await adapter.getOpenInterest(symbol);
    
    this.cache.openInterest.set(cacheKey, { data: openInterest, timestamp: Date.now() });
    return openInterest;
  }
  
  async getMarketData(exchange: ExchangeName, symbol: string, timeframe: Timeframe): Promise<{
    ticker: Ticker;
    candles: Candle[];
    orderBook: OrderBook;
    fundingRate?: FundingRate;
    openInterest?: OpenInterest;
  }> {
    const [ticker, candles, orderBook, fundingRate, openInterest] = await Promise.all([
      this.getTicker(exchange, symbol),
      this.getCandles(exchange, symbol, timeframe),
      this.getOrderBook(exchange, symbol),
      this.getFundingRate(exchange, symbol).catch(() => undefined),
      this.getOpenInterest(exchange, symbol).catch(() => undefined),
    ]);
    
    return { ticker, candles, orderBook, fundingRate, openInterest };
  }
  
  subscribeTicker(exchange: ExchangeName, symbol: string, callback: (ticker: Ticker) => void): () => void {
    const adapter = this.getAdapter(exchange);
    const unsubscribe = adapter.subscribeTicker(symbol, (ticker) => {
      const cacheKey = `${exchange}:${symbol}`;
      this.cache.tickers.set(cacheKey, { data: ticker, timestamp: Date.now() });
      callback(ticker);
    });
    
    const subKey = `${exchange}:${symbol}:ticker`;
    this.wsSubscriptions.set(subKey, unsubscribe);
    return unsubscribe;
  }
  
  subscribeCandles(exchange: ExchangeName, symbol: string, timeframe: Timeframe, callback: (candle: Candle) => void): () => void {
    const adapter = this.getAdapter(exchange);
    const unsubscribe = adapter.subscribeCandles(symbol, timeframe, (candle) => {
      const cacheKey = `${exchange}:${symbol}:${timeframe}:500`;
      const cached = this.cache.candles.get(cacheKey);
      if (cached) {
        cached.data = [...cached.data.slice(-499), candle];
        cached.timestamp = Date.now();
      }
      callback(candle);
    });
    
    const subKey = `${exchange}:${symbol}:${timeframe}:candles`;
    this.wsSubscriptions.set(subKey, unsubscribe);
    return unsubscribe;
  }
  
  subscribeOrderBook(exchange: ExchangeName, symbol: string, callback: (orderBook: OrderBook) => void): () => void {
    const adapter = this.getAdapter(exchange);
    const unsubscribe = adapter.subscribeOrderBook(symbol, (orderBook) => {
      const cacheKey = `${exchange}:${symbol}:100`;
      this.cache.orderBooks.set(cacheKey, { data: orderBook, timestamp: Date.now() });
      callback(orderBook);
    });
    
    const subKey = `${exchange}:${symbol}:orderbook`;
    this.wsSubscriptions.set(subKey, unsubscribe);
    return unsubscribe;
  }
  
  subscribeTrades(exchange: ExchangeName, symbol: string, callback: (trade: { price: number; amount: number; side: 'BUY' | 'SELL'; timestamp: number }) => void): () => void {
    const adapter = this.getAdapter(exchange);
    const unsubscribe = adapter.subscribeTrades(symbol, callback);
    
    const subKey = `${exchange}:${symbol}:trades`;
    this.wsSubscriptions.set(subKey, unsubscribe);
    return unsubscribe;
  }
  
  unsubscribeAll(): void {
    for (const [key, unsubscribe] of this.wsSubscriptions) {
      try {
        unsubscribe();
      } catch (error) {
        console.error(`Error unsubscribing ${key}:`, error);
      }
    }
    this.wsSubscriptions.clear();
  }
  
  clearCache(): void {
    this.cache.tickers.clear();
    this.cache.candles.clear();
    this.cache.orderBooks.clear();
    this.cache.fundingRates.clear();
    this.cache.openInterest.clear();
  }
  
  async storeCandlesToDb(exchange: ExchangeName, symbol: string, timeframe: Timeframe, candles: Candle[]): Promise<void> {
    await prisma.marketData.createMany({
      data: candles.map(c => ({
        exchange,
        symbol,
        baseAsset: symbol.split('/')[0],
        quoteAsset: symbol.split('/')[1],
        timeframe,
        openPrice: c.open,
        highPrice: c.high,
        lowPrice: c.low,
        closePrice: c.close,
        volume: c.volume,
        quoteVolume: c.quoteVolume,
        tradesCount: c.tradesCount,
        timestamp: new Date(c.timestamp),
      })),
      skipDuplicates: true,
    });
  }
  
  async getStoredCandles(exchange: ExchangeName, symbol: string, timeframe: Timeframe, startTime: Date, endTime: Date): Promise<Candle[]> {
    const data = await prisma.marketData.findMany({
      where: {
        exchange,
        symbol,
        timeframe,
        timestamp: {
          gte: startTime,
          lte: endTime,
        },
      },
      orderBy: { timestamp: 'asc' },
    });
    
    return data.map(d => ({
      timestamp: d.timestamp.getTime(),
      open: Number(d.openPrice),
      high: Number(d.highPrice),
      low: Number(d.lowPrice),
      close: Number(d.closePrice),
      volume: Number(d.volume),
      quoteVolume: Number(d.quoteVolume),
      tradesCount: d.tradesCount,
    }));
  }
}

export const marketDataService = new MarketDataService();
