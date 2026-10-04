import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '@utils/jwt';
import { prisma } from '@utils/prisma';
import type { UserJwtPayload } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: UserJwtPayload;
  userId?: string;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractTokenFromHeader(req.headers.authorization);
  
  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No token provided' },
    });
    return;
  }
  
  const payload = verifyAccessToken(token);
  
  if (!payload) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
    });
    return;
  }
  
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, isActive: true, role: true },
  });
  
  if (!user || !user.isActive) {
    res.status(401).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found or inactive' },
    });
    return;
  }
  
  req.user = payload;
  req.userId = payload.userId;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
      return;
    }
    next();
  };
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractTokenFromHeader(req.headers.authorization);
  
  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      req.user = payload;
      req.userId = payload.userId;
    }
  }
  next();
}
