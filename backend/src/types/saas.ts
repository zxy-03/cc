export interface Tenant {
  id: string;
  name: string;
  plan: SubscriptionPlan;
  status: 'active' | 'suspended' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

export interface Subscription {
  id: string;
  tenantId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  role: 'owner' | 'admin' | 'member';
  name: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface ApiKey {
  id: string;
  tenantId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  permissions: ApiKeyPermission[];
  rateLimit: number;
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
  isActive: boolean;
}

export interface ApiKeyPermission {
  resource: 'chat' | 'roundtable' | 'collaboration' | 'models';
  actions: ('read' | 'write')[];
}

export interface ApiKeyCreateRequest {
  name: string;
  permissions: ApiKeyPermission[];
  rateLimit: number;
  expiresInDays?: number;
}

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export interface UsageRecord {
  id: string;
  tenantId: string;
  apiKeyId: string;
  endpoint: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: Date;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, {
  maxApiKeys: number;
  maxRequestsPerMinute: number;
  maxTokensPerMonth: number;
  monthlyPrice: number;
  features: string[];
}> = {
  free: {
    maxApiKeys: 1,
    maxRequestsPerMinute: 10,
    maxTokensPerMonth: 100000,
    monthlyPrice: 0,
    features: ['基础对话功能', '圆桌会议', '单模型协作'],
  },
  pro: {
    maxApiKeys: 5,
    maxRequestsPerMinute: 60,
    maxTokensPerMonth: 1000000,
    monthlyPrice: 99,
    features: ['全部功能', '自定义任务分工', '优先响应', '分析报告'],
  },
  enterprise: {
    maxApiKeys: -1,
    maxRequestsPerMinute: 300,
    maxTokensPerMonth: -1,
    monthlyPrice: 399,
    features: ['无限制API密钥', '自定义模型配置', '专属支持', 'SLA保障'],
  },
};