import { ModelInfo } from '../types';

export const MODEL_REGISTRY: ModelInfo[] = [
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'claude',
    adapter: 'claude',
    role: 'analyst',
    expertise: ['分析', '逻辑推理', '问题拆解'],
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'claude',
    adapter: 'claude',
    role: 'writer',
    expertise: ['深入解释', '详细阐述', '知识科普'],
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'deepseek',
    adapter: 'deepseek',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    baseUrlEnv: 'DEEPSEEK_BASE_URL',
    role: 'creative',
    expertise: ['创意写作', '创新思路', '独特视角'],
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    adapter: 'deepseek',
    apiKeyEnv: 'DEEPSEEK_R1_API_KEY',
    baseUrlEnv: 'DEEPSEEK_R1_BASE_URL',
    role: 'fact-checker',
    expertise: ['事实核查', '数据验证', '信息确认'],
  },
  {
    id: 'deepseek-moe',
    name: 'DeepSeek MoE',
    provider: 'deepseek',
    adapter: 'deepseek',
    apiKeyEnv: 'DEEPSEEK_MOE_API_KEY',
    baseUrlEnv: 'DEEPSEEK_MOE_BASE_URL',
    role: 'summarizer',
    expertise: ['总结归纳', '要点提炼', '结论汇总'],
  },
];

export const getModelById = (modelId: string): ModelInfo | undefined => {
  return MODEL_REGISTRY.find((model) => model.id === modelId);
};
