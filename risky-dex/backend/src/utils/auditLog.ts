import { Request, Response, NextFunction } from 'express';
import { prisma } from '@utils/prisma';
import type { AuthenticatedRequest } from '@middleware/auth';

interface AuditLogParams {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        oldData: params.oldData as any,
        newData: params.newData as any,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        success: params.success ?? true,
        errorMessage: params.errorMessage,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

export function auditLogMiddleware(action: string, resource: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const originalSend = res.send;
    let responseBody: unknown;
    
    res.send = function (body?: unknown): Response {
      responseBody = body;
      return originalSend.call(this, body);
    };
    
    res.on('finish', async () => {
      const statusCode = res.statusCode;
      const success = statusCode >= 200 && statusCode < 400;
      
      await createAuditLog({
        userId: req.userId,
        action,
        resource,
        resourceId: req.params.id,
        oldData: req.method !== 'GET' ? req.body as Record<string, unknown> : undefined,
        newData: success ? responseBody as Record<string, unknown> : undefined,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        success,
        errorMessage: success ? undefined : (responseBody as any)?.error?.message,
      });
    });
    
    next();
  };
}
