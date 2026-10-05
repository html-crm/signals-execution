import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { prisma } from '../utils/prisma';
import { generateTokenPair } from '../utils/jwt';
import bcrypt from 'bcryptjs';
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

router.post('/register', validateBody(registerSchema), async (req, res) => {
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
  
  const { accessToken, refreshToken } = generateTokenPair(user);
  
  res.status(201).json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken,
      refreshToken,
    },
  });
});

router.post('/login', validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
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
  
  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      error: { code: 'ACCOUNT_INACTIVE', message: 'Account is deactivated' },
    });
  }
  
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  
  const { accessToken, refreshToken } = generateTokenPair(user);
  
  res.json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken,
      refreshToken,
    },
  });
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_TOKEN', message: 'Refresh token required' },
    });
  }
  
  const payload = require('../utils/jwt').verifyRefreshToken(refreshToken);
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
  
  const tokens = require('../utils/jwt').generateTokenPair(payload);
  res.json({ success: true, data: tokens });
});

router.post('/logout', async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
  }
  
  const payload = require('../utils/jwt').verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
  }
  
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
  }
  
  res.json({
    success: true,
    data: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

export default router;