import { Router, Request, Response } from 'express';
import { SaasStore } from '../store/SaasStore';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/JwtUtils';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, tenantName } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password and name are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    const tenant = SaasStore.createTenant(tenantName || `${name}'s Workspace`);
    const user = SaasStore.createUser(tenant.id, email, password, name, 'owner');

    if (!user) {
      res.status(500).json({ error: 'Failed to create user' });
      return;
    }

    const accessToken = generateAccessToken(user.id, tenant.id, user.role);
    const refreshToken = generateRefreshToken(user.id, tenant.id, user.role);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: tenant.id,
        tenantName: tenant.name,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(409).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = SaasStore.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValid = SaasStore.validatePassword(user, password);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const tenant = SaasStore.getTenant(user.tenantId);
    if (!tenant || tenant.status !== 'active') {
      res.status(403).json({ error: 'Account is not active' });
      return;
    }

    SaasStore.updateLastLogin(user.id);

    const accessToken = generateAccessToken(user.id, user.tenantId, user.role);
    const refreshToken = generateRefreshToken(user.id, user.tenantId, user.role);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: tenant.name,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const payload = verifyToken(refreshToken);
    if (!payload || payload.type !== 'refresh') {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const user = SaasStore.getUser(payload.sub);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const tenant = SaasStore.getTenant(user.tenantId);
    if (!tenant || tenant.status !== 'active') {
      res.status(403).json({ error: 'Account is not active' });
      return;
    }

    const newAccessToken = generateAccessToken(user.id, user.tenantId, user.role);
    const newRefreshToken = generateRefreshToken(user.id, user.tenantId, user.role);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.type !== 'access') {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const user = SaasStore.getUser(payload.sub);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const tenant = SaasStore.getTenant(user.tenantId);
    const subscription = SaasStore.getSubscription(user.tenantId);
    const usage = SaasStore.getMonthlyUsageTotals(user.tenantId);
    const limits = SaasStore.getPlanLimits(user.tenantId);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: tenant?.name,
      },
      subscription: subscription ? {
        plan: subscription.plan,
        status: subscription.status,
        endDate: subscription.endDate,
      } : null,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cost: usage.cost,
        requestCount: usage.requestCount,
        limit: limits.maxTokensPerMonth,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;