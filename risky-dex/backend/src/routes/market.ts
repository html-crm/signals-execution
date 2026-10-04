import { Router, Request, Response } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '@middleware/auth';
import { validateQuery } from '@middleware/validation';
import { marketDataService } from '@services/marketData';
import { z } from 'zod';
import type { ExchangeName, Timeframe } from '../types';

const router = Router();

const tickerSchema = z.object({
  exchange: z.enum(['BINANCE', 'BYBIT', 'OKX', 'MEXC', 'BITGET', 'BINGX']),
  symbol: z.string(),
});

const candlesSchema = z.object({
  exchange: z.enum(['BINANCE', 'BYBIT', 'OKX', 'MEXC', 'BITGET', 'BINGX']),
  symbol: z.string(),
  timeframe: z.enum(['M15', 'M30', 'H1', 'H4', 'D1', 'W1']),
  limit: z.coerce.number().min(1).max(1000).default(500),
});

const orderBookSchema = z.object({
  exchange: z.enum(['BINANCE', 'BYBIT', 'OKX', 'MEXC', 'BITGET', 'BINGX']),
  symbol: z.string(),
  limit: z.coerce.number().min(1).max(500).default(100),
});

const marketDataSchema = z.object({
  exchange: z.enum(['BINANCE', 'BYBIT', 'OKX', 'MEXC', 'BITGET', 'BINGX']),
  symbol: z.string(),
  timeframe: z.enum(['M15', 'M30', 'H1', 'H4', 'D1', 'W1']),
});

router.get('/ticker', validateQuery(tickerSchema), async (req: Request, res: Response) => {
  const { exchange, symbol } = req.query as { exchange: ExchangeName; symbol: string };
  
  try {
    const ticker = await marketDataService.getTicker(exchange, symbol);
    res.json({ success: true, data: ticker });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'TICKER_ERROR', message: (error as Error).message },
    });
  }
});

router.get('/tickers', validateQuery(tickerSchema.omit({ symbol: true })), async (req: Request, res: Response) => {
  const { exchange } = req.query as { exchange: ExchangeName };
  
  try {
    const tickers = await marketDataService.getTickers(exchange);
    res.json({ success: true, data: tickers });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'TICKERS_ERROR', message: (error as Error).message },
    });
  }
});

router.get('/candles', validateQuery(candlesSchema), async (req: Request, res: Response) => {
  const { exchange, symbol, timeframe, limit } = req.query as {
    exchange: ExchangeName;
    symbol: string;
    timeframe: Timeframe;
    limit: number;
  };
  
  try {
    const candles = await marketDataService.getCandles(exchange, symbol, timeframe, limit);
    res.json({ success: true, data: candles });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CANDLES_ERROR', message: (error as Error).message },
    });
  }
});

router.get('/orderbook', validateQuery(orderBookSchema), async (req: Request, res: Response) => {
  const { exchange, symbol, limit } = req.query as {
    exchange: ExchangeName;
    symbol: string;
    limit: number;
  };
  
  try {
    const orderBook = await marketDataService.getOrderBook(exchange, symbol, limit);
    res.json({ success: true, data: orderBook });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ORDERBOOK_ERROR', message: (error as Error).message },
    });
  }
});

router.get('/funding-rate', validateQuery(tickerSchema), async (req: Request, res: Response) => {
  const { exchange, symbol } = req.query as { exchange: ExchangeName; symbol: string };
  
  try {
    const fundingRate = await marketDataService.getFundingRate(exchange, symbol);
    res.json({ success: true, data: fundingRate });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FUNDING_RATE_ERROR', message: (error as Error).message },
    });
  }
});

router.get('/open-interest', validateQuery(tickerSchema), async (req: Request, res: Response) => {
  const { exchange, symbol } = req.query as { exchange: ExchangeName; symbol: string };
  
  try {
    const openInterest = await marketDataService.getOpenInterest(exchange, symbol);
    res.json({ success: true, data: openInterest });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'OPEN_INTEREST_ERROR', message: (error as Error).message },
    });
  }
});

router.get('/market-data', validateQuery(marketDataSchema), async (req: Request, res: Response) => {
  const { exchange, symbol, timeframe } = req.query as {
    exchange: ExchangeName;
    symbol: string;
    timeframe: Timeframe;
  };
  
  try {
    const data = await marketDataService.getMarketData(exchange, symbol, timeframe);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'MARKET_DATA_ERROR', message: (error as Error).message },
    });
  }
});

router.get('/exchanges', (req: Request, res: Response) => {
  const exchanges = [
    { id: 'BINANCE', name: 'Binance', hasWs: true },
    { id: 'BYBIT', name: 'Bybit', hasWs: true },
    { id: 'OKX', name: 'OKX', hasWs: true },
    { id: 'MEXC', name: 'MEXC', hasWs: true },
    { id: 'BITGET', name: 'Bitget', hasWs: true },
    { id: 'BINGX', name: 'BingX', hasWs: true },
  ];
  
  res.json({ success: true, data: exchanges });
});

router.get('/timeframes', (req: Request, res: Response) => {
  const timeframes = [
    { id: 'M15', label: '15m' },
    { id: 'M30', label: '30m' },
    { id: 'H1', label: '1h' },
    { id: 'H4', label: '4h' },
    { id: 'D1', label: '1D' },
    { id: 'W1', label: '1W' },
  ];
  
  res.json({ success: true, data: timeframes });
});

export default router;
