import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, Subscription, UsageInfo, SubscriptionPlan, PlanInfo } from '../types/auth';
import { authApi, subscriptionApi } from '../api/authClient';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  subscription: Subscription | null;
  usage: UsageInfo | null;
  plans: PlanInfo[];
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, tenantName?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  upgradePlan: (plan: SubscriptionPlan) => Promise<void>;
  loadPlans: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [plans, setPlans] = useState<PlanInfo[]>([]);

  const loadUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const data = await authApi.getMe();
      setUser(data.user);
      setSubscription(data.subscription as Subscription);
      setUsage(data.usage);
    } catch (error) {
      console.error('Failed to load user data:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPlans = useCallback(async () => {
    try {
      const data = await subscriptionApi.getPlans();
      setPlans(data.plans);
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    loadPlans();
  }, [loadUserData, loadPlans]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    setUser(response.user);
    await loadUserData();
  };

  const register = async (email: string, password: string, name: string, tenantName?: string) => {
    const response = await authApi.register(email, password, name, tenantName);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    setUser(response.user);
    await loadUserData();
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setSubscription(null);
    setUsage(null);
  };

  const refreshUser = async () => {
    await loadUserData();
  };

  const upgradePlan = async (plan: SubscriptionPlan) => {
    await subscriptionApi.upgrade(plan);
    await loadUserData();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        subscription,
        usage,
        plans,
        login,
        register,
        logout,
        refreshUser,
        upgradePlan,
        loadPlans,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};