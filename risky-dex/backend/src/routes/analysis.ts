import { Router, Request, Response } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '@middleware/auth';
import { validateBody, validateQuery } from '@middleware/validation';
import { tradingService } from '@services/trading';
import { signalEngine } from '@services/signalEngine';
import { z } from 'zod';
import type { Timeframe, ExchangeName } from '../types';
import { prisma } from '@utils/prisma';

const router = Router();

const analyzeSchema = z.object({
  exchangeAccountId: z.string().cuid(),
  symbol: z.string(),
  timeframe: z.enum(['M15', 'M30', 'H1', 'H4', 'D1', 'W1']),
});

const analyzeWithCredentialsSchema = z.object({
  exchange: z.enum(['BINANCE', 'BYBIT', 'OKX', 'MEXC', 'BITGET', 'BINGX']),
  symbol: z.string(),
  timeframe: z.enum(['M15', 'M30', 'H1', 'H4', 'D1', 'W1']),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  passphrase: z.string().optional(),
});

router.post('/analyze', authMiddleware, validateBody(analyzeSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exchangeAccountId, symbol, timeframe } = req.body;
    
    const account = await prisma.exchangeAccount.findUnique({
      where: { id: exchangeAccountId },
    });
    
    if (!account || account.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied to this exchange account' },
      });
    }
    
    const signal = await tradingService.generateSignal({ exchangeAccountId, symbol, timeframe });
    res.json({ success: true, data: signal });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ANALYSIS_ERROR', message: (error as Error).message },
    });
  }
});

router.post('/analyze-public', validateBody(analyzeWithCredentialsSchema), async (req: Request, res: Response) => {
  try {
    const { exchange, symbol, timeframe, apiKey, apiSecret, passphrase } = req.body;
    
    // For public analysis without auth, use provided credentials or defaults
    // This is for demo/testing purposes
    const signal = await signalEngine.analyze({
      symbol,
      timeframe,
      exchange,
      candles: [], // Will be fetched internally
      ticker: {} as any, // Will be fetched internally
    });
    
    res.json({ success: true, data: signal });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ANALYSIS_ERROR', message: (error as Error).message },
    });
  }
});

router.get('/scanner', authMiddleware, validateQuery(z.object({
  exchangeAccountId: z.string().cuid(),
  symbols: z.string(),
  timeframe: z.enum(['M15', 'M30', 'H1', 'H4', 'D1', 'W1']),
})), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exchangeAccountId, symbols, timeframe } = req.query as {
      exchangeAccountId: string;
      symbols: string;
      timeframe: Timeframe;
    };
    
    const account = await prisma.exchangeAccount.findUnique({
      where: { id: exchangeAccountId },
    });
    
    if (!account || account.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }
    
    const symbolList = symbols.split(',');
    const results = [];
    
    for (const symbol of symbolList) {
      try {
        const signal = await tradingService.generateSignal({ exchangeAccountId, symbol: symbol.trim(), timeframe });
        results.push({ symbol: symbol.trim(), ...signal });
      } catch (error) {
        results.push({ symbol: symbol.trim(), error: (error as Error).message });
      }
    }
    
    results.sort((a, b) => (b as any).confidence - (a as any).confidence);
    
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SCANNER_ERROR', message: (error as Error).message },
    });
  }
});

router.get('/signals/history', authMiddleware, validateQuery(z.object({
  exchangeAccountId: z.string().cuid().optional(),
  symbol: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
})), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exchangeAccountId, symbol, limit } = req.query as {
      exchangeAccountId?: string;
      symbol?: string;
      limit: number;
    };
    
    const where: any = {};
    
    if (exchangeAccountId) {
      const account = await prisma.exchangeAccount.findUnique({ where: { id: exchangeAccountId } });
      if (!account || account.userId !== req.userId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' },
        });
      }
      where.exchangeAccountId = exchangeAccountId;
    } else {
      const userAccounts = await prisma.exchangeAccount.findMany({ where: { userId: req.userId } });
      where.exchangeAccountId = { in: userAccounts.map(a => a.id) };
    }
    
    if (symbol) where.symbol = symbol;
    
    const signals = await prisma.signal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    res.json({ success: true, data: signals });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SIGNALS_ERROR', message: (error as Error).message },
    });
  }
});

export default router;
