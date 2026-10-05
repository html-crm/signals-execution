import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

router.get('/health', async (req, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      },
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Service unhealthy' },
    });
  }
});

export default router;