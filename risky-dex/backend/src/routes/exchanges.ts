import { Router, Request, Response } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '@middleware/auth';
import { validateBody } from '@middleware/validation';
import { prisma } from '@utils/prisma';
import { encrypt, decrypt } from '@utils/encryption';
import { z } from 'zod';
import type { ExchangeName } from '../types';

const router = Router();

const createAccountSchema = z.object({
  exchange: z.enum(['BINANCE', 'BYBIT', 'OKX', 'MEXC', 'BITGET', 'BINGX']),
  name: z.string().min(1).max(50),
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
  passphrase: z.string().optional(),
  isDefault: z.boolean().default(false),
});

const updateAccountSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  apiKey: z.string().min(1).optional(),
  apiSecret: z.string().min(1).optional(),
  passphrase: z.string().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accounts = await prisma.exchangeAccount.findMany({
      where: { userId: req.userId },
      include: {
        apiKey: { select: { id: true, name: true, permissions: true, isActive: true, lastUsedAt: true, createdAt: true } },
        _count: { select: { balances: true, positions: true, orders: true, trades: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'ACCOUNTS_ERROR', message: (error as Error).message } });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const account = await prisma.exchangeAccount.findFirst({
      where: { id, userId: req.userId },
      include: {
        apiKey: { select: { id: true, name: true, permissions: true, isActive: true, lastUsedAt: true, createdAt: true } },
        balances: true,
        positions: { where: { status: 'OPEN' } },
        orders: { take: 10, orderBy: { createdAt: 'desc' } },
        trades: { take: 10, orderBy: { executedAt: 'desc' } },
        bots: { select: { id: true, name: true, status: true, symbol: true, strategy: true, performance: true } },
      },
    });
    
    if (!account) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } });
    }
    
    res.json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'ACCOUNT_ERROR', message: (error as Error).message } });
  }
});

router.post('/', authMiddleware, validateBody(createAccountSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exchange, name, apiKey, apiSecret, passphrase, isDefault } = req.body;
    
    const encryptedApiKey = encrypt(apiKey);
    const encryptedApiSecret = encrypt(apiSecret);
    const encryptedPassphrase = passphrase ? encrypt(passphrase) : null;
    
    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        userId: req.userId!,
        name: `${exchange} - ${name}`,
        exchange: exchange as ExchangeName,
        apiKeyEncrypted: encryptedApiKey,
        apiSecretEncrypted: encryptedApiSecret,
        apiPassphraseEncrypted: encryptedPassphrase || undefined,
      },
    });
    
    if (isDefault) {
      await prisma.exchangeAccount.updateMany({
        where: { userId: req.userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    
    const account = await prisma.exchangeAccount.create({
      data: {
        userId: req.userId!,
        exchange: exchange as ExchangeName,
        accountId: `acc_${Date.now()}`,
        name,
        isDefault,
        apiKeyId: apiKeyRecord.id,
      },
    });
    
    res.json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'CREATE_ACCOUNT_ERROR', message: (error as Error).message } });
  }
});

router.patch('/:id', authMiddleware, validateBody(updateAccountSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, apiKey, apiSecret, passphrase, isActive, isDefault } = req.body;
    
    const account = await prisma.exchangeAccount.findFirst({ where: { id, userId: req.userId } });
    if (!account) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } });
    }
    
    if (isDefault) {
      await prisma.exchangeAccount.updateMany({
        where: { userId: req.userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    
    const updateData: any = { name, isActive, isDefault };
    
    if (apiKey || apiSecret || passphrase) {
      const encryptedApiKey = apiKey ? encrypt(apiKey) : undefined;
      const encryptedApiSecret = apiSecret ? encrypt(apiSecret) : undefined;
      const encryptedPassphrase = passphrase ? encrypt(passphrase) : undefined;
      
      await prisma.apiKey.update({
        where: { id: account.apiKeyId },
        data: {
          apiKeyEncrypted: encryptedApiKey,
          apiSecretEncrypted: encryptedApiSecret,
          apiPassphraseEncrypted: encryptedPassphrase,
        },
      });
    }
    
    const updated = await prisma.exchangeAccount.update({ where: { id }, data: updateData });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'UPDATE_ACCOUNT_ERROR', message: (error as Error).message } });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const account = await prisma.exchangeAccount.findFirst({ where: { id, userId: req.userId } });
    if (!account) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } });
    }
    
    await prisma.apiKey.delete({ where: { id: account.apiKeyId } });
    await prisma.exchangeAccount.delete({ where: { id } });
    
    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'DELETE_ACCOUNT_ERROR', message: (error as Error).message } });
  }
});

router.post('/:id/test', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const account = await prisma.exchangeAccount.findFirst({
      where: { id, userId: req.userId },
      include: { apiKey: true },
    });
    
    if (!account) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } });
    }
    
    // Import the adapter factory dynamically to avoid circular deps
    const { createExchangeAdapter } = await import('@adapters/index');
    
    const credentials = {
      apiKey: decrypt(account.apiKey.apiKeyEncrypted),
      apiSecret: decrypt(account.apiKey.apiSecretEncrypted),
      passphrase: account.apiKey.apiPassphraseEncrypted ? decrypt(account.apiKey.apiPassphraseEncrypted) : undefined,
    };
    
    const adapter = createExchangeAdapter(account.exchange, credentials);
    const isConnected = await adapter.ping();
    
    await prisma.apiKey.update({
      where: { id: account.apiKeyId },
      data: { lastUsedAt: new Date() },
    });
    
    res.json({ success: true, data: { connected: isConnected } });
  } catch (error) {
    res.json({ success: true, data: { connected: false, error: (error as Error).message } });
  }
});

export default router;
