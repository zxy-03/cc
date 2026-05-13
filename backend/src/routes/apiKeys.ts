import { Router, Request, Response } from 'express';
import { SaasStore } from '../store/SaasStore';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { ApiKeyPermission } from '../types/saas';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const apiKeys = SaasStore.getApiKeysByTenant(tenantId);

    res.json({
      apiKeys: apiKeys.map(key => ({
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        permissions: key.permissions,
        rateLimit: key.rateLimit,
        expiresAt: key.expiresAt,
        createdAt: key.createdAt,
        lastUsedAt: key.lastUsedAt,
        isActive: key.isActive,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get API keys' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { name, permissions, rateLimit, expiresInDays } = req.body;

    if (!name || !permissions || !Array.isArray(permissions)) {
      res.status(400).json({ error: 'Name and permissions are required' });
      return;
    }

    const validPermissions: ApiKeyPermission[] = permissions.map((p: any) => ({
      resource: p.resource,
      actions: p.actions,
    }));

    const limits = SaasStore.getPlanLimits(tenantId);
    const defaultRateLimit = rateLimit || limits.maxRequestsPerMinute;

    const { apiKey, plainKey } = SaasStore.createApiKey(
      tenantId,
      name,
      validPermissions,
      defaultRateLimit,
      expiresInDays
    );

    res.status(201).json({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
      plainKey,
      warning: 'This is the only time you will see the full API key. Please save it securely.',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('limit')) {
      res.status(403).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

router.get('/:keyId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { keyId } = req.params;

    const apiKey = SaasStore.getApiKey(keyId);
    if (!apiKey || apiKey.tenantId !== tenantId) {
      res.status(404).json({ error: 'API key not found' });
      return;
    }

    res.json({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
        lastUsedAt: apiKey.lastUsedAt,
        isActive: apiKey.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get API key' });
  }
});

router.delete('/:keyId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { keyId } = req.params;

    const apiKey = SaasStore.getApiKey(keyId);
    if (!apiKey || apiKey.tenantId !== tenantId) {
      res.status(404).json({ error: 'API key not found' });
      return;
    }

    const success = SaasStore.revokeApiKey(keyId);
    if (!success) {
      res.status(500).json({ error: 'Failed to revoke API key' });
      return;
    }

    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

export default router;