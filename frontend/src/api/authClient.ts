import axios from 'axios';
import { AuthResponse, PlanInfo, SubscriptionResponse, ApiKey, UsageInfo } from '../types/auth';

const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return axios(error.config);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: async (email: string, password: string, name: string, tenantName?: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { email, password, name, tenantName });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getMe: async (): Promise<{
    user: AuthResponse['user'];
    subscription: SubscriptionResponse;
    usage: UsageInfo;
  }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const subscriptionApi = {
  getPlans: async (): Promise<{ plans: PlanInfo[] }> => {
    const response = await api.get('/subscription/plans');
    return response.data;
  },

  getCurrent: async (): Promise<SubscriptionResponse> => {
    const response = await api.get('/subscription/current');
    return response.data;
  },

  upgrade: async (plan: string): Promise<{ message: string; subscription: any }> => {
    const response = await api.post('/subscription/upgrade', { plan });
    return response.data;
  },

  cancel: async (): Promise<{ message: string }> => {
    const response = await api.post('/subscription/cancel');
    return response.data;
  },

  getUsage: async (startDate?: string, endDate?: string): Promise<{ records: UsageInfo[]; summary: UsageInfo }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/subscription/usage?${params.toString()}`);
    return response.data;
  },
};

export const apiKeysApi = {
  getAll: async (): Promise<{ apiKeys: ApiKey[] }> => {
    const response = await api.get('/api-keys');
    return response.data;
  },

  create: async (data: {
    name: string;
    permissions: { resource: string; actions: string[] }[];
    rateLimit?: number;
    expiresInDays?: number;
  }): Promise<{ apiKey: ApiKey; plainKey: string; warning: string }> => {
    const response = await api.post('/api-keys', data);
    return response.data;
  },

  delete: async (keyId: string): Promise<void> => {
    await api.delete(`/api-keys/${keyId}`);
  },
};