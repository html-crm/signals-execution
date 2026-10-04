import { Router, Request, Response } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '@middleware/auth';
import { validateBody, validateQuery } from '@middleware/validation';
import { tradingService } from '@services/trading';
import { riskEngine } from '@services/riskEngine';
import { z } from 'zod';
import type { OrderParams, TradeMode, OrderSide, OrderType } from '../types';
import { prisma } from '@utils/prisma';

const router = Router();

const placeOrderSchema = z.object({
  exchangeAccountId: z.string().cuid(),
  botId: z.string().cuid().optional(),
  symbol: z.string(),
  side: z.enum(['BUY', 'SELL']),
  type: z.enum(['MARKET', 'LIMIT', 'STOP_LIMIT', 'STOP_MARKET']),
  amount: z.number().positive(),
  price: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
  reduceOnly: z.boolean().default(false),
  postOnly: z.boolean().default(false),
  tradeMode: z.enum(['PAPER', 'LIVE']),
});

const closePositionSchema = z.object({
  exchangeAccountId: z.string().cuid(),
  positionId: z.string().cuid(),
  percentage: z.number().min(1).max(100).default(100),
});

const modifyPositionSchema = z.object({
  exchangeAccountId: z.string().cuid(),
  positionId: z.string().cuid(),
  stopLoss: z.number().positive().optional(),
  takeProfit: z.number().positive().optional(),
});

router.post('/order', authMiddleware, validateBody(placeOrderSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exchangeAccountId, botId, ...order } = req.body as OrderParams & { exchangeAccountId: string; botId?: string; tradeMode: TradeMode };
    
    const account = await prisma.exchangeAccount.findUnique({
      where: { id: exchangeAccountId },
    });
    
    if (!account || account.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied to this exchange account' },
      });
    }
    
    const result = await tradingService.placeOrder({
      userId: req.userId!,
      exchangeAccountId,
      botId,
      order: order as OrderParams,
      tradeMode: order.tradeMode,
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ORDER_ERROR', message: (error as Error).message },
    });
  }
});

router.delete('/order/:orderId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { exchangeAccountId, symbol } = req.query as { exchangeAccountId: string; symbol: string };
    
    const account = await prisma.exchangeAccount.findUnique({
      where: { id: exchangeAccountId },
    });
    
    if (!account || account.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }
    
    await tradingService.cancelOrder(exchangeAccountId, orderId, symbol);
    res.json({ success: true, message: 'Order cancelled' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CANCEL_ERROR', message: (error as Error).message },
    });
  }
});

router.post('/position/close', authMiddleware, validateBody(closePositionSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exchangeAccountId, positionId, percentage } = req.body;
    
    const account = await prisma.exchangeAccount.findUnique({
      where: { id: exchangeAccountId },
    });
    
    if (!account || account.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }
    
    const result = await tradingService.closePosition(exchangeAccountId, positionId, percentage);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CLOSE_POSITION_ERROR', message: (error as Error).message },
    });
  }
});

router.patch('/position/:positionId', authMiddleware, validateBody(modifyPositionSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { positionId } = req.params;
    const { exchangeAccountId, stopLoss, takeProfit } = req.body;
    
    const account = await prisma.exchangeAccount.findUnique({
      where: { id: exchangeAccountId },
    });
    
    if (!account || account.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }
    
    await tradingService.modifyPosition(exchangeAccountId, positionId, stopLoss, takeProfit);
    res.json({ success: true, message: 'Position updated' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'MODIFY_POSITION_ERROR', message: (error as Error).message },
    });
  }
});

router.get('/positions', authMiddleware, validateQuery(z.object({
  exchangeAccountId: z.string().cuid(),
})), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exchangeAccountId } = req.query as { exchangeAccountId: string };
    
    const account = await prisma.exchangeAccount.findUnique({
      where: { id: exchangeAccountId },
    });
    
    if (!account || account.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }
    
    const positions = await tradingService.getPositions(exchangeAccountId);
    res.json({ success: true, data: positions });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'POSITIONS_ERROR', message: (error as Error).message },
    });
  }
});

router.post('/positions/sync', authMiddleware, validateBody(z.object({
  exchangeAccountId: z.string().cuid(),
})), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exchangeAccountId } = req.body;
    
    const account = await prisma.exchangeAccount.findUnique({
      where: { id: exchangeAccountId },
    });
    
    if (!account || account.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }
    
    await tradingService.syncPositions(exchangeAccountId);
    res.json({ success: true, message: 'Positions synced' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SYNC_ERROR', message: (error as Error).message },
    });
  }
});

router.get('/orders', authMiddleware, validateQuery(z.object({
  exchangeAccountId: z.string().cuid().optional(),
  botId: z.string().cuid().optional(),
  symbol: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
})), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exchangeAccountId, botId, symbol, status, limit } = req.query as {
      exchangeAccountId?: string;
      botId?: string;
      symbol?: string;
      status?: string;
      limit: number;
    };
    
    const where: any = { userId: req.userId };
    
    if (exchangeAccountId) {
      const account = await prisma.exchangeAccount.findUnique({ where: { id: exchangeAccountId } });
      if (!account || account.userId !== req.userId) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
      }
      where.exchangeAccountId = exchangeAccountId;
    }
    
    if (botId) where.botId = botId;
    if (symbol) where.symbol = symbol;
    if (status) where.status = status;
    
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ORDERS_ERROR', message: (error as Error).message },
    });
  }
});

router.get('/trades', authMiddleware, validateQuery(z.object({
  exchangeAccountId: z.string().cuid().optional(),
  botId: z.string().cuid().optional(),
  symbol: z.string().optional(),
  tradeMode: z.enum(['PAPER', 'LIVE']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
})), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exchangeAccountId, botId, symbol, tradeMode, limit } = req.query as {
      exchangeAccountId?: string;
      botId?: string;
      symbol?: string;
      tradeMode?: TradeMode;
      limit: number;
    };
    
    const where: any = { userId: req.userId };
    
    if (exchangeAccountId) {
      const account = await prisma.exchangeAccount.findUnique({ where: { id: exchangeAccountId } });
      if (!account || account.userId !== req.userId) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
      }
      where.exchangeAccountId = exchangeAccountId;
    }
    
    if (botId) where.botId = botId;
    if (symbol) where.symbol = symbol;
    if (tradeMode) where.tradeMode = tradeMode;
    
    const trades = await prisma.trade.findMany({
      where,
      orderBy: { executedAt: 'desc' },
      take: limit,
    });
    
    res.json({ success: true, data: trades });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'TRADES_ERROR', message: (error as Error).message },
    });
  }
});

router.get('/risk/metrics', authMiddleware, validateQuery(z.object({
  exchangeAccountId: z.string().cuid(),
})), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exchangeAccountId } = req.query as { exchangeAccountId: string };
    
    const account = await prisma.exchangeAccount.findUnique({
      where: { id: exchangeAccountId },
    });
    
    if (!account || account.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }
    
    const positions = await prisma.position.findMany({
      where: { exchangeAccountId, status: 'OPEN' },
    });
    
    riskEngine.updatePositions(positions.length, positions.reduce((sum, p) => sum + Number(p.value), 0));
    
    const dailyPnl = await prisma.trade.aggregate({
      where: {
        userId: req.userId,
        executedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        tradeMode: 'LIVE',
      },
      _sum: { pnl: true },
    });
    
    riskEngine.updateDailyPnl(Number(dailyPnl._sum.pnl || 0));
    
    const metrics = riskEngine.getRiskMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'RISK_METRICS_ERROR', message: (error as Error).message },
    });
  }
});

export default router;
