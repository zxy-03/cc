import { Tenant, User, ApiKey, Subscription, UsageRecord, SubscriptionPlan, ApiKeyPermission, PLAN_LIMITS } from '../types/saas';
import * as fs from 'fs';
import * as path from 'path';

interface SaasStore {
  tenants: Record<string, Tenant>;
  users: Record<string, User>;
  apiKeys: Record<string, ApiKey>;
  subscriptions: Record<string, Subscription>;
  usage: UsageRecord[];
}

const DATA_DIR = path.join(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'saas-store.json');

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function hashPassword(password: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}

function loadStore(): SaasStore {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load SaaS store:', error);
  }
  return {
    tenants: {},
    users: {},
    apiKeys: {},
    subscriptions: {},
    usage: [],
  };
}

function saveStore(store: SaasStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
  } catch (error) {
    console.error('Failed to save SaaS store:', error);
  }
}

let store = loadStore();

export const SaasStore = {
  createTenant(name: string): Tenant {
    const id = `tenant-${generateId()}`;
    const tenant: Tenant = {
      id,
      name,
      plan: 'free',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.tenants[id] = tenant;

    const subscription: Subscription = {
      id: `sub-${generateId()}`,
      tenantId: id,
      plan: 'free',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      autoRenew: true,
    };
    store.subscriptions[subscription.id] = subscription;

    saveStore(store);
    return tenant;
  },

  getTenant(tenantId: string): Tenant | undefined {
    return store.tenants[tenantId];
  },

  updateTenant(tenantId: string, updates: Partial<Tenant>): Tenant | undefined {
    const tenant = store.tenants[tenantId];
    if (!tenant) return undefined;

    const updated = { ...tenant, ...updates, updatedAt: new Date() };
    store.tenants[tenantId] = updated;
    saveStore(store);
    return updated;
  },

  createUser(tenantId: string, email: string, password: string, name: string, role: 'owner' | 'admin' | 'member' = 'member'): User | undefined {
    const existingUser = Object.values(store.users).find(u => u.email === email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const id = `user-${generateId()}`;
    const user: User = {
      id,
      tenantId,
      email,
      passwordHash: hashPassword(password),
      role,
      name,
      createdAt: new Date(),
    };
    store.users[id] = user;
    saveStore(store);
    return user;
  },

  getUser(userId: string): User | undefined {
    return store.users[userId];
  },

  getUserByEmail(email: string): User | undefined {
    return Object.values(store.users).find(u => u.email === email);
  },

  getUsersByTenant(tenantId: string): User[] {
    return Object.values(store.users).filter(u => u.tenantId === tenantId);
  },

  validatePassword(user: User, password: string): boolean {
    return user.passwordHash === hashPassword(password);
  },

  updateLastLogin(userId: string): void {
    const user = store.users[userId];
    if (user) {
      user.lastLoginAt = new Date();
      saveStore(store);
    }
  },

  createApiKey(
    tenantId: string,
    name: string,
    permissions: ApiKeyPermission[],
    rateLimit: number,
    expiresInDays?: number
  ): { apiKey: ApiKey; plainKey: string } {
    const tenant = store.tenants[tenantId];
    if (!tenant) throw new Error('Tenant not found');

    const planLimits = PLAN_LIMITS[tenant.plan];
    const existingKeys = Object.values(store.apiKeys).filter(k => k.tenantId === tenantId && k.isActive);

    if (planLimits.maxApiKeys !== -1 && existingKeys.length >= planLimits.maxApiKeys) {
      throw new Error(`API key limit reached for ${tenant.plan} plan. Maximum: ${planLimits.maxApiKeys}`);
    }

    const plainKey = `sk_${generateId()}_${generateId()}`;
    const keyHash = hashPassword(plainKey);
    const keyPrefix = plainKey.substring(0, 12);

    const id = `key-${generateId()}`;
    const apiKey: ApiKey = {
      id,
      tenantId,
      name,
      keyHash,
      keyPrefix,
      permissions,
      rateLimit,
      expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : undefined,
      createdAt: new Date(),
      isActive: true,
    };

    store.apiKeys[id] = apiKey;
    saveStore(store);

    return { apiKey, plainKey };
  },

  getApiKey(keyId: string): ApiKey | undefined {
    return store.apiKeys[keyId];
  },

  getApiKeyByHash(keyHash: string): ApiKey | undefined {
    return Object.values(store.apiKeys).find(k => k.keyHash === keyHash);
  },

  validateApiKey(plainKey: string): ApiKey | undefined {
    const keyHash = hashPassword(plainKey);
    const apiKey = this.getApiKeyByHash(keyHash);

    if (!apiKey || !apiKey.isActive) return undefined;
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) return undefined;

    apiKey.lastUsedAt = new Date();
    saveStore(store);

    return apiKey;
  },

  revokeApiKey(keyId: string): boolean {
    const key = store.apiKeys[keyId];
    if (!key) return false;
    key.isActive = false;
    saveStore(store);
    return true;
  },

  getApiKeysByTenant(tenantId: string): ApiKey[] {
    return Object.values(store.apiKeys).filter(k => k.tenantId === tenantId);
  },

  updateSubscription(tenantId: string, plan: SubscriptionPlan): Subscription | undefined {
    const tenant = store.tenants[tenantId];
    if (!tenant) return undefined;

    tenant.plan = plan;
    tenant.updatedAt = new Date();

    const existingSub = Object.values(store.subscriptions).find(
      s => s.tenantId === tenantId && s.status === 'active'
    );

    if (existingSub) {
      existingSub.plan = plan;
      existingSub.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      saveStore(store);
      return existingSub;
    }

    const subscription: Subscription = {
      id: `sub-${generateId()}`,
      tenantId,
      plan,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      autoRenew: true,
    };
    store.subscriptions[subscription.id] = subscription;
    saveStore(store);
    return subscription;
  },

  getSubscription(tenantId: string): Subscription | undefined {
    return Object.values(store.subscriptions).find(
      s => s.tenantId === tenantId && s.status === 'active'
    );
  },

  getPlanLimits(tenantId: string) {
    const tenant = store.tenants[tenantId];
    if (!tenant) return PLAN_LIMITS.free;
    return PLAN_LIMITS[tenant.plan];
  },

  recordUsage(tenantId: string, apiKeyId: string, endpoint: string, modelId: string, inputTokens: number, outputTokens: number, cost: number): void {
    const record: UsageRecord = {
      id: `usage-${generateId()}`,
      tenantId,
      apiKeyId,
      endpoint,
      modelId,
      inputTokens,
      outputTokens,
      cost,
      timestamp: new Date(),
    };
    store.usage.push(record);

    if (store.usage.length > 10000) {
      store.usage = store.usage.slice(-5000);
    }

    saveStore(store);
  },

  getUsageByTenant(tenantId: string, startDate?: Date, endDate?: Date): UsageRecord[] {
    let usage = store.usage.filter(u => u.tenantId === tenantId);

    if (startDate) {
      usage = usage.filter(u => new Date(u.timestamp) >= startDate);
    }
    if (endDate) {
      usage = usage.filter(u => new Date(u.timestamp) <= endDate);
    }

    return usage;
  },

  getMonthlyUsageTotals(tenantId: string): { inputTokens: number; outputTokens: number; cost: number; requestCount: number } {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = this.getUsageByTenant(tenantId, startOfMonth);

    return usage.reduce(
      (acc, u) => ({
        inputTokens: acc.inputTokens + u.inputTokens,
        outputTokens: acc.outputTokens + u.outputTokens,
        cost: acc.cost + u.cost,
        requestCount: acc.requestCount + 1,
      }),
      { inputTokens: 0, outputTokens: 0, cost: 0, requestCount: 0 }
    );
  },
};