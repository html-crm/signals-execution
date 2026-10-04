import { Router, Request, Response } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '@middleware/auth';
import { validateQuery } from '@middleware/validation';
import { prisma } from '@utils/prisma';
import { z } from 'zod';

const router = Router();

router.get('/overview', authMiddleware, validateQuery(z.object({
  exchangeAccountId: z.string().cuid().optional(),
})), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exchangeAccountId } = req.query as { exchangeAccountId?: string };
    
    const where: any = { userId: req.userId };
    
    if (exchangeAccountId) {
      const account = await prisma.exchangeAccount.findUnique({ where: { id: exchangeAccountId } });
      if (!account || account.userId !== req.userId) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
      }
      where.exchangeAccountId = exchangeAccountId;
    }
    
    const accounts = await prisma.exchangeAccount.findMany({ where });
    const accountIds = accounts.map(a => a.id);
    
    const [balances, positions, trades, bots] = await Promise.all([
      prisma.accountBalance.findMany({ where: { exchangeAccountId: { in: accountIds } } }),
      prisma.position.findMany({ where: { exchangeAccountId: { in: accountIds }, status: 'OPEN' } }),
      prisma.trade.findMany({
        where: { userId: req.userId, executedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        orderBy: { executedAt: 'desc' },
      }),
      prisma.bot.findMany({ where: { userId: req.userId } }),
    ]);
    
    const totalValue = balances.reduce((sum, b) => sum + Number(b.usdValue || b.total), 0);
    const availableBalance = balances.reduce((sum, b) => sum + Number(b.free), 0);
    const unrealizedPnl = positions.reduce((sum, p) => sum + Number(p.unrealizedPnl), 0);
    const realizedPnl = trades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
    
    const todayTrades = trades.filter(t => t.tradeMode === 'LIVE');
    const todayPnl = todayTrades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
    const todayVolume = todayTrades.reduce((sum, t) => sum + Number(t.value), 0);
    
    const winningTrades = todayTrades.filter(t => Number(t.pnl || 0) > 0).length;
    const losingTrades = todayTrades.filter(t => Number(t.pnl || 0) < 0).length;
    const winRate = todayTrades.length > 0 ? (winningTrades / todayTrades.length) * 100 : 0;
    
    res.json({
      success: true,
      data: {
        totalEquity: totalValue,
        availableBalance,
        deployedCapital: totalValue - availableBalance,
        unrealizedPnl,
        realizedPnl,
        todayPnl,
        todayVolume,
        totalTrades: todayTrades.length,
        winningTrades,
        losingTrades,
        winRate,
        openPositions: positions.length,
        activeBots: bots.filter(b => b.status === 'RUNNING').length,
        totalBots: bots.length,
        byAccount: accounts.map(a => ({
          id: a.id,
          exchange: a.exchange,
          name: a.name,
          balances: balances.filter(b => b.exchangeAccountId === a.id),
          positions: positions.filter(p => p.exchangeAccountId === a.id),
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'OVERVIEW_ERROR', message: (error as Error).message },
    });
  }
});

router.get('/equity', authMiddleware, validateQuery(z.object({
  exchangeAccountId: z.string().cuid().optional(),
  timeframe: z.enum(['1H', '6H', '24H', '7D', '30D']).default('24H'),
})), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exchangeAccountId, timeframe } = req.query as { exchangeAccountId?: string; timeframe: string };
    
    const where: any = { userId: req.userId };
    if (exchangeAccountId) where.exchangeAccountId = exchangeAccountId;
    
    const trades = await prisma.trade.findMany({
      where,
      orderBy: { executedAt: 'asc' },
    });
    
    let equityPoints: { time: string; value: number }[] = [];
    let runningEquity = 10000;
    
    const timeframeMs = {
      '1H': 60 * 60 * 1000,
      '6H': 6 * 60 * 60 * 1000,
      '24H': 24 * 60 * 60 * 1000,
      '7D': 7 * 24 * 60 * 60 * 1000,
      '30D': 30 * 24 * 60 * 60 * 1000,
    }[timeframe] || 24 * 60 * 60 * 1000;
    
    const now = Date.now();
    const points = Math.min(100, trades.length);
    
    for (let i = 0; i <= points; i++) {
      const timestamp = now - timeframeMs + (timeframeMs / points) * i;
      const tradeIndex = Math.floor((i / points) * trades.length);
      const relevantTrades = trades.slice(0, tradeIndex);
      const equity = 10000 + relevantTrades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
      
      equityPoints.push({
        time: new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        value: equity,
      });
    }
    
    res.json({ success: true, data: equityPoints });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'EQUITY_ERROR', message: (error as Error).message },
    });
  }
});

router.get('/performance', authMiddleware, validateQuery(z.object({
  exchangeAccountId: z.string().cuid().optional(),
  botId: z.string().cuid().optional(),
})), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exchangeAccountId, botId } = req.query as { exchangeAccountId?: string; botId?: string };
    
    const where: any = { userId: req.userId };
    if (exchangeAccountId) where.exchangeAccountId = exchangeAccountId;
    if (botId) where.botId = botId;
    
    const trades = await prisma.trade.findMany({ where });
    
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => Number(t.pnl || 0) > 0).length;
    const losingTrades = trades.filter(t => Number(t.pnl || 0) < 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    const totalPnl = trades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
    const grossProfit = trades.filter(t => Number(t.pnl || 0) > 0).reduce((sum, t) => sum + Number(t.pnl || 0), 0);
    const grossLoss = Math.abs(trades.filter(t => Number(t.pnl || 0) < 0).reduce((sum, t) => sum + Number(t.pnl || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
    
    const avgWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
    
    const equityCurve = trades.map(t => Number(t.pnl || 0)).reduce((acc, pnl, i) => {
      const prev = acc[i - 1] || 10000;
      return [...acc, prev + pnl];
    }, [] as number[]);
    
    let maxDrawdown = 0;
    let peak = equityCurve[0] || 10000;
    for (const equity of equityCurve) {
      if (equity > peak) peak = equity;
      const drawdown = peak - equity;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    
    res.json({
      success: true,
      data: {
        totalTrades,
        winningTrades,
        losingTrades,
        winRate,
        totalPnl,
        grossProfit,
        grossLoss,
        profitFactor,
        avgWin,
        avgLoss,
        maxDrawdown,
        maxDrawdownPercent: peak > 0 ? (maxDrawdown / peak) * 100 : 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'PERFORMANCE_ERROR', message: (error as Error).message },
    });
  }
});

export default router;
