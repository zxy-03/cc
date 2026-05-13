import { Router, Request, Response } from 'express';
import { SaasStore } from '../store/SaasStore';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { SubscriptionPlan, PLAN_LIMITS } from '../types/saas';

const router = Router();

router.get('/plans', async (req: Request, res: Response) => {
  const plans = Object.entries(PLAN_LIMITS).map(([key, value]) => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    price: value.monthlyPrice,
    features: value.features,
    limits: {
      maxApiKeys: value.maxApiKeys,
      maxRequestsPerMinute: value.maxRequestsPerMinute,
      maxTokensPerMonth: value.maxTokensPerMonth,
    },
  }));

  res.json({ plans });
});

router.get('/current', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const tenant = SaasStore.getTenant(tenantId);
    const subscription = SaasStore.getSubscription(tenantId);
    const usage = SaasStore.getMonthlyUsageTotals(tenantId);
    const limits = PLAN_LIMITS[tenant?.plan || 'free'];

    res.json({
      plan: tenant?.plan || 'free',
      status: subscription?.status || 'active',
      startDate: subscription?.startDate,
      endDate: subscription?.endDate,
      autoRenew: subscription?.autoRenew,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cost: usage.cost,
        requestCount: usage.requestCount,
      },
      limits: {
        maxApiKeys: limits.maxApiKeys,
        maxRequestsPerMinute: limits.maxRequestsPerMinute,
        maxTokensPerMonth: limits.maxTokensPerMonth,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get subscription info' });
  }
});

router.post('/upgrade', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { plan } = req.body;
    const tenantId = req.tenantId!;

    if (!['free', 'pro', 'enterprise'].includes(plan)) {
      res.status(400).json({ error: 'Invalid plan' });
      return;
    }

    const subscription = SaasStore.updateSubscription(tenantId, plan as SubscriptionPlan);

    if (!subscription) {
      res.status(500).json({ error: 'Failed to update subscription' });
      return;
    }

    const limits = PLAN_LIMITS[plan as SubscriptionPlan];

    res.json({
      message: 'Subscription updated successfully',
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      },
      limits: {
        maxApiKeys: limits.maxApiKeys,
        maxRequestsPerMinute: limits.maxRequestsPerMinute,
        maxTokensPerMonth: limits.maxTokensPerMonth,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
});

router.post('/cancel', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const subscription = SaasStore.updateSubscription(tenantId, 'free');

    res.json({
      message: 'Subscription cancelled. You are now on the free plan.',
      subscription: {
        plan: 'free',
        status: 'active',
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

router.get('/usage', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { startDate, endDate } = req.query;

    const usage = SaasStore.getUsageByTenant(
      tenantId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    const totals = SaasStore.getMonthlyUsageTotals(tenantId);
    const limits = SaasStore.getPlanLimits(tenantId);

    res.json({
      records: usage,
      summary: {
        inputTokens: totals.inputTokens,
        outputTokens: totals.outputTokens,
        cost: totals.cost,
        requestCount: totals.requestCount,
        limit: limits.maxTokensPerMonth,
        percentUsed: limits.maxTokensPerMonth > 0
          ? Math.round((totals.inputTokens + totals.outputTokens) / limits.maxTokensPerMonth * 100)
          : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get usage data' });
  }
});

export default router;