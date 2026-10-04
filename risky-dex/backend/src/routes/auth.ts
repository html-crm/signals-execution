import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@utils/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@utils/jwt';
import { authMiddleware, type AuthenticatedRequest } from '@middleware/auth';
import { validateBody } from '@middleware/validation';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', validateBody(registerSchema), async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: { code: 'EMAIL_EXISTS', message: 'Email already registered' },
    });
  }
  
  const passwordHash = await bcrypt.hash(password, 12);
  
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });
  
  await prisma.userSettings.create({
    data: { userId: user.id },
  });
  
  const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });
  
  res.json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken,
      refreshToken,
    },
  });
});

router.post('/login', validateBody(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
  }
  
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
  }
  
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  
  const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });
  
  res.json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken,
      refreshToken,
    },
  });
});

router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_TOKEN', message: 'Refresh token required' },
    });
  }
  
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' },
    });
  }
  
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found or inactive' },
    });
  }
  
  const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
  const newRefreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });
  
  res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
});

router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, email: true, name: true, role: true, createdAt: true, lastLoginAt: true },
  });
  
  res.json({ success: true, data: user });
});

router.post('/logout', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
