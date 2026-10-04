import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import type { UserJwtPayload } from '../types';

const accessTokenOptions: SignOptions = { expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'] };
const refreshTokenOptions: SignOptions = { expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'] };

export function generateAccessToken(payload: UserJwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, accessTokenOptions);
}

export function generateRefreshToken(payload: UserJwtPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, refreshTokenOptions);
}

export function verifyAccessToken(token: string): UserJwtPayload | null {
  try {
    return jwt.verify(token, config.jwt.secret) as UserJwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): UserJwtPayload | null {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as UserJwtPayload;
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}
