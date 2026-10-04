import { Router, Request, Response } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '@middleware/auth';
import { validateBody } from '@middleware/validation';
import { prisma } from '@utils/prisma';
import { z } from 'zod';
import type { BotStrategy, Timeframe, TradeMode, BotConfig, RiskSettings } from '../types';

const router = Router();

const createBotSchema = z.object({
  name: z.string().min(1).max(50),
  exchangeAccountId: z.string().cuid(),
  symbol: z.string(),
  strategy: z.enum(['MOMENTUM', 'MEAN_REVERSION', 'GRID', 'DCA', 'BREAKOUT', 'CUSTOM']),
  timeframe: z.enum(['M15', 'M30', 'H1', 'H4', 'D1', 'W1']).default('H1'),
  tradeMode: z.enum(['PAPER', 'LIVE']).default('PAPER'),
  leverage: z.number().int().min(1).max(125).default(1),
  config: z.object({
    buyConditions: z.object({
      priceChangePercent: z.number(),
      volumeThreshold: z.number(),
      momentumThreshold: z.enum(['BEARISH', 'NEUTRAL', 'BULLISH']),
      allowSlippage: z.number(),
      minimumLiquidity: z.number(),
    }),
    sellConditions: z.object({
      takeProfitPercent: z.number(),
      stopLossPercent: z.number(),
      trailingStopPercent: z.number().optional(),
      timeBasedExit: z.object({ enabled: z.boolean(), maxHoldTimeMinutes: z.number() }).optional(),
    }),
    capital: z.object({
      initialCapital: z.number(),
      tradeSize: z.number(),
      tradeSizeType: z.enum(['FIXED', 'PERCENTAGE']),
      maxExposure: z.number(),
      maxExposureType: z.enum(['FIXED', 'PERCENTAGE']),
      reserveCapital: z.number(),
    }),
    riskLimits: z.object({
      maxDailyLoss: z.number(),
      maxDailyLossType: z.enum(['FIXED', 'PERCENTAGE']),
      maxOpenPositions: z.number(),
      maxPositionSize: z.number(),
      maxSlippage: z.number(),
      cooldownAfterLoss: z.number(),
      emergencyStopLoss: z.number(),
    }),
  }),
  riskSettings: z.object({
    maxTradeSize: z.number(),
    maxDailyLoss: z.number(),
    maxExposure: z.number(),
    maxOpenPositions: z.number(),
    maxSlippage: z.number(),
    stopLossPercent: z.number(),
    takeProfitPercent: z.number(),
    emergencyShutdown: z.boolean(),
  }),
});

const updateBotSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  status: z.enum(['STOPPED', 'RUNNING', 'PAUSED', 'ERROR']).optional(),
  config: z.any().optional(),
  riskSettings: z.any().optional(),
  tradeMode: z.enum(['PAPER', 'LIVE']).optional(),
  leverage: z.number().int().min(1).max(125).optional(),
});

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bots = await prisma.bot.findMany({
      where: { userId: req.userId },
      include: {
        exchangeAccount: { select: { id: true, name: true, exchange: true } },
        _count: { select: { trades: true, orders: true, positions: true, signals: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({ success: true, data: bots });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'BOTS_ERROR', message: (error as Error).message } });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const bot = await prisma.bot.findFirst({
      where: { id, userId: req.userId },
      include: {
        exchangeAccount: { select: { id: true, name: true, exchange: true } },
        trades: { take: 50, orderBy: { executedAt: 'desc' } },
        orders: { take: 50, orderBy: { createdAt: 'desc' } },
        positions: { where: { status: 'OPEN' } },
        signals: { take: 20, orderBy: { createdAt: 'desc' } },
        performance: true,
      },
    });
    
    if (!bot) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Bot not found' } });
    }
    
    res.json({ success: true, data: bot });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'BOT_ERROR', message: (error as Error).message } });
  }
});

router.post('/', authMiddleware, validateBody(createBotSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exchangeAccountId, name, symbol, strategy, timeframe, tradeMode, leverage, config, riskSettings } = req.body;
    
    const account = await prisma.exchangeAccount.findFirst({
      where: { id: exchangeAccountId, userId: req.userId },
    });
    
    if (!account) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied to this exchange account' } });
    }
    
    const bot = await prisma.bot.create({
      data: {
        userId: req.userId!,
        exchangeAccountId,
        name,
        symbol,
        baseAsset: symbol.split('/')[0],
        quoteAsset: symbol.split('/')[1],
        strategy,
        timeframe,
        tradeMode,
        leverage,
        config,
        riskSettings,
        performance: {
          totalPnl: 0,
          totalPnlPercent: 0,
          todayPnl: 0,
          todayPnlPercent: 0,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          avgWin: 0,
          avgLoss: 0,
          profitFactor: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          maxDrawdownPercent: 0,
          currentEquity: config.capital.initialCapital,
          startingCapital: config.capital.initialCapital,
          deployedCapital: 0,
          unrealizedPnl: 0,
          realizedPnl: 0,
          fees: 0,
          exposure: 0,
          exposurePercent: 0,
        },
      },
    });
    
    res.json({ success: true, data: bot });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'CREATE_BOT_ERROR', message: (error as Error).message } });
  }
});

router.patch('/:id', authMiddleware, validateBody(updateBotSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, config, riskSettings, tradeMode, leverage, ...updates } = req.body;
    
    const bot = await prisma.bot.findFirst({ where: { id, userId: req.userId } });
    if (!bot) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Bot not found' } });
    }
    
    const updateData: any = { ...updates };
    
    if (status) {
      updateData.status = status;
      if (status === 'RUNNING' && !bot.startedAt) updateData.startedAt = new Date();
      if (status === 'STOPPED') updateData.stoppedAt = new Date();
    }
    
    if (config) updateData.config = config;
    if (riskSettings) updateData.riskSettings = riskSettings;
    if (tradeMode) updateData.tradeMode = tradeMode;
    if (leverage) updateData.leverage = leverage;
    
    const updated = await prisma.bot.update({ where: { id }, data: updateData });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'UPDATE_BOT_ERROR', message: (error as Error).message } });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const bot = await prisma.bot.findFirst({ where: { id, userId: req.userId } });
    if (!bot) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Bot not found' } });
    }
    
    await prisma.bot.delete({ where: { id } });
    res.json({ success: true, message: 'Bot deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'DELETE_BOT_ERROR', message: (error as Error).message } });
  }
});

router.post('/:id/start', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const bot = await prisma.bot.findFirst({ where: { id, userId: req.userId } });
    if (!bot) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Bot not found' } });
    }
    
    await prisma.bot.update({
      where: { id },
      data: { status: 'RUNNING', startedAt: new Date() },
    });
    
    res.json({ success: true, message: 'Bot started' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'START_BOT_ERROR', message: (error as Error).message } });
  }
});

router.post('/:id/stop', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const bot = await prisma.bot.findFirst({ where: { id, userId: req.userId } });
    if (!bot) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Bot not found' } });
    }
    
    await prisma.bot.update({
      where: { id },
      data: { status: 'STOPPED', stoppedAt: new Date() },
    });
    
    res.json({ success: true, message: 'Bot stopped' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'STOP_BOT_ERROR', message: (error as Error).message } });
  }
});

router.post('/:id/pause', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const bot = await prisma.bot.findFirst({ where: { id, userId: req.userId } });
    if (!bot) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Bot not found' } });
    }
    
    await prisma.bot.update({ where: { id }, data: { status: 'PAUSED' } });
    res.json({ success: true, message: 'Bot paused' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'PAUSE_BOT_ERROR', message: (error as Error).message } });
  }
});

router.get('/templates/list', (req: Request, res: Response) => {
  const templates = [
    {
      id: 'momentum-template',
      name: 'MOMENTUM',
      description: 'Trend-following strategy that buys on momentum breakouts and sells on trend exhaustion',
      strategy: 'MOMENTUM',
      riskLevel: 'MEDIUM',
      recommendedCapital: 2000,
      typicalTradeFrequency: '10-30 trades/day',
      tags: ['Trending', 'High Frequency', 'Solana', 'Ethereum'],
    },
    {
      id: 'mean-reversion-template',
      name: 'MEAN REVERSION',
      description: 'Buys oversold assets and sells overbought assets based on statistical deviation',
      strategy: 'MEAN_REVERSION',
      riskLevel: 'LOW',
      recommendedCapital: 1500,
      typicalTradeFrequency: '5-15 trades/day',
      tags: ['Range-bound', 'Lower Risk', 'All Chains'],
    },
    {
      id: 'grid-template',
      name: 'GRID',
      description: 'Places buy/sell orders at fixed intervals to profit from sideways markets',
      strategy: 'GRID',
      riskLevel: 'LOW',
      recommendedCapital: 3000,
      typicalTradeFrequency: '20-50 trades/day',
      tags: ['Sideways', 'Consistent', 'High Frequency'],
    },
    {
      id: 'dca-template',
      name: 'DCA',
      description: 'Dollar-cost averaging into positions over time to reduce entry timing risk',
      strategy: 'DCA',
      riskLevel: 'LOW',
      recommendedCapital: 5000,
      typicalTradeFrequency: '2-5 trades/day',
      tags: ['Long-term', 'Low Stress', 'All Chains'],
    },
    {
      id: 'breakout-template',
      name: 'BREAKOUT',
      description: 'Captures explosive moves when price breaks key resistance/support levels',
      strategy: 'BREAKOUT',
      riskLevel: 'HIGH',
      recommendedCapital: 1000,
      typicalTradeFrequency: '3-10 trades/day',
      tags: ['Volatile', 'High Reward', 'Meme Coins'],
    },
  ];
  
  res.json({ success: true, data: templates });
});

export default router;
