import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, extractApiKeyFromHeader } from '../utils/JwtUtils';
import { SaasStore } from '../store/SaasStore';
import { JwtPayload, ApiKey, PLAN_LIMITS } from '../types/saas';

export interface AuthRequest extends Request {
  user?: JwtPayload;
  apiKey?: ApiKey;
  tenantId?: string;
  rateLimit?: {
    limit: number;
    remaining: number;
    resetAt: Date;
  };
}

const requestCounts: Record<string, { count: number; resetAt: number }> = {};

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (token) {
    const payload = verifyToken(token);
    if (payload && payload.type === 'access') {
      req.user = payload;
      req.tenantId = payload.tenantId;
    }
  }

  next();
}

export function apiKeyAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const apiKeyValue = extractApiKeyFromHeader(req.headers.authorization);

  if (apiKeyValue) {
    const apiKey = SaasStore.validateApiKey(apiKeyValue);
    if (apiKey) {
      req.apiKey = apiKey;
      req.tenantId = apiKey.tenantId;
    }
  }

  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}

export function requireApiKey(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.apiKey) {
    res.status(401).json({ error: 'API key required' });
    return;
  }
  next();
}

export function requirePermission(resource: 'chat' | 'roundtable' | 'collaboration' | 'models', action: 'read' | 'write') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user) {
      return next();
    }

    if (req.apiKey) {
      const hasPermission = req.apiKey.permissions.some(
        p => p.resource === resource && p.actions.includes(action)
      );

      if (!hasPermission) {
        res.status(403).json({ error: `No permission for ${action} on ${resource}` });
        return;
      }
    }

    next();
  };
}

export function rateLimitMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const tenantId = req.tenantId;
  if (!tenantId) {
    return next();
  }

  const limits = SaasStore.getPlanLimits(tenantId);
  const limit = limits.maxRequestsPerMinute;

  const now = Date.now();
  const key = `${tenantId}:${Math.floor(now / 60000)}`;

  if (!requestCounts[key]) {
    requestCounts[key] = { count: 0, resetAt: now + 60000 };
  }

  const record = requestCounts[key];

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + 60000;
  }

  record.count++;

  if (record.count > limit) {
    res.status(429).json({
      error: 'Rate limit exceeded',
      limit,
      remaining: 0,
      resetAt: new Date(record.resetAt).toISOString(),
    });
    return;
  }

  req.rateLimit = {
    limit,
    remaining: Math.max(0, limit - record.count),
    resetAt: new Date(record.resetAt),
  };

  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', req.rateLimit.remaining);
  res.setHeader('X-RateLimit-Reset', record.resetAt);

  next();
}

export function tenantIsolationMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user) {
    const tenant = SaasStore.getTenant(req.user.tenantId);
    if (!tenant || tenant.status !== 'active') {
      res.status(403).json({ error: 'Tenant is not active' });
      return;
    }
  }

  if (req.apiKey) {
    const tenant = SaasStore.getTenant(req.apiKey.tenantId);
    if (!tenant || tenant.status !== 'active') {
      res.status(403).json({ error: 'Tenant is not active' });
      return;
    }
  }

  next();
}

export function subscriptionMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.tenantId) {
    return next();
  }

  const limits = SaasStore.getPlanLimits(req.tenantId);
  const subscription = SaasStore.getSubscription(req.tenantId);

  if (!subscription || subscription.status !== 'active') {
    res.status(403).json({ error: 'No active subscription' });
    return;
  }

  req.rateLimit = {
    limit: limits.maxRequestsPerMinute,
    remaining: limits.maxRequestsPerMinute,
    resetAt: new Date(Date.now() + 60000),
  };

  next();
}