import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionPlan } from '../types/auth';

export const SubscriptionPage: React.FC = () => {
  const { subscription, usage, plans, upgradePlan, loadPlans } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    setError('');
    setIsUpgrading(true);
    try {
      await upgradePlan(plan);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upgrade');
    } finally {
      setIsUpgrading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Current Plan</h2>

        <div className="flex items-center gap-4 mb-6">
          <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
            {subscription?.plan?.charAt(0).toUpperCase()}{subscription?.plan?.slice(1)} Plan
          </div>
          <span className={`px-3 py-1 rounded-full text-sm ${
            subscription?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {subscription?.status}
          </span>
        </div>

        {usage && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Monthly Usage</span>
                <span className="font-medium">{formatNumber(usage.inputTokens + usage.outputTokens)} / {formatNumber(usage.limit)} tokens</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(usage.percentUsed || 0, 100)}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">{usage.requestCount}</div>
                <div className="text-sm text-gray-500">Requests</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">${usage.cost.toFixed(2)}</div>
                <div className="text-sm text-gray-500">Cost</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">{usage.percentUsed || 0}%</div>
                <div className="text-sm text-gray-500">Limit Used</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Available Plans</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-xl p-6 ${
                plan.id === subscription?.plan ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
              }`}
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="text-xs text-gray-500 mb-4 space-y-1">
                <div>Max API Keys: {plan.limits.maxApiKeys === -1 ? 'Unlimited' : plan.limits.maxApiKeys}</div>
                <div>Rate Limit: {plan.limits.maxRequestsPerMinute} req/min</div>
                <div>Monthly Tokens: {plan.limits.maxTokensPerMonth === -1 ? 'Unlimited' : formatNumber(plan.limits.maxTokensPerMonth)}</div>
              </div>

              {plan.id === subscription?.plan ? (
                <button
                  disabled
                  className="w-full py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id as SubscriptionPlan)}
                  disabled={isUpgrading}
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    plan.price > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300'
                      : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300'
                  }`}
                >
                  {isUpgrading ? 'Upgrading...' : plan.price > 0 ? 'Upgrade' : 'Downgrade'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ApiKeysPage: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions] = useState<{ resource: string; actions: string[] }[]>([
    { resource: 'chat', actions: ['read', 'write'] }
  ]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadApiKeys = async () => {
    setIsLoading(true);
    try {
      const { apiKeysApi } = await import('../api/authClient');
      const data = await apiKeysApi.getAll();
      setApiKeys(data.apiKeys);
    } catch (err) {
      console.error('Failed to load API keys:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a name for the API key');
      return;
    }

    setError('');
    try {
      const { apiKeysApi } = await import('../api/authClient');
      const result = await apiKeysApi.create({
        name: newKeyName,
        permissions: newKeyPermissions,
      });
      setCreatedKey(result.plainKey);
      setApiKeys([...apiKeys, result.apiKey]);
      setShowCreate(false);
      setNewKeyName('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create API key');
    }
  };

  const handleDelete = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;

    try {
      const { apiKeysApi } = await import('../api/authClient');
      await apiKeysApi.delete(keyId);
      setApiKeys(apiKeys.filter(k => k.id !== keyId));
    } catch (err) {
      console.error('Failed to delete API key:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">API Keys</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your API keys for programmatic access</p>
          </div>
          {!showCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Key
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {createdKey && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-green-800">API Key Created</h4>
                <p className="text-sm text-green-700 mt-1">Copy this key now. You won't be able to see it again!</p>
                <code className="block mt-2 p-2 bg-white rounded border border-green-200 text-sm font-mono break-all">
                  {createdKey}
                </code>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(createdKey)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Copy
                </button>
                <button
                  onClick={() => setCreatedKey(null)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {showCreate && (
          <div className="border border-blue-200 rounded-lg p-4 mb-4 bg-blue-50">
            <h4 className="font-medium text-gray-800 mb-4">Create New API Key</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API Key"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No API keys yet. Create one to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div key={key.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800">{key.name}</div>
                  <div className="text-sm text-gray-500 font-mono">{key.keyPrefix}***</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Created: {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsedAt && ` • Last used: ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    key.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {key.isActive ? 'Active' : 'Revoked'}
                  </span>
                  {key.isActive && (
                    <button
                      onClick={() => handleDelete(key.id)}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};