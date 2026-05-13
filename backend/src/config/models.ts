import { ModelInfo } from '../types';

export const MODEL_REGISTRY: ModelInfo[] = [
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'claude',
    adapter: 'claude',
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'claude',
    adapter: 'claude',
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'deepseek',
    adapter: 'deepseek',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    baseUrlEnv: 'DEEPSEEK_BASE_URL',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    adapter: 'deepseek',
    apiKeyEnv: 'DEEPSEEK_R1_API_KEY',
    baseUrlEnv: 'DEEPSEEK_R1_BASE_URL',
  },
  {
    id: 'deepseek-moe',
    name: 'DeepSeek MoE',
    provider: 'deepseek',
    adapter: 'deepseek',
    apiKeyEnv: 'DEEPSEEK_MOE_API_KEY',
    baseUrlEnv: 'DEEPSEEK_MOE_BASE_URL',
  },
];

export const getModelById = (modelId: string): ModelInfo | undefined => {
  return MODEL_REGISTRY.find((model) => model.id === modelId);
};
