export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  tenantId: string;
  tenantName: string;
}

export interface Subscription {
  plan: SubscriptionPlan;
  status: 'active' | 'expired' | 'cancelled';
  endDate?: string;
  autoRenew?: boolean;
}

export interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
  cost: number;
  requestCount: number;
  limit: number;
  percentUsed?: number;
}

export interface PlanInfo {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits: {
    maxApiKeys: number;
    maxRequestsPerMinute: number;
    maxTokensPerMonth: number;
  };
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: { resource: string; actions: string[] }[];
  rateLimit: number;
  expiresAt?: string;
  createdAt: string;
  lastUsedAt?: string;
  isActive: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface SubscriptionResponse {
  plan: SubscriptionPlan;
  status: string;
  startDate?: string;
  endDate?: string;
  autoRenew?: boolean;
  usage: UsageInfo;
  limits: {
    maxApiKeys: number;
    maxRequestsPerMinute: number;
    maxTokensPerMonth: number;
  };
}