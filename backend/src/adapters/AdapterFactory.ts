import { ModelInfo, IAIModelAdapter } from '../types';
import { ClaudeAdapter } from './ClaudeAdapter';
import { DeepSeekAdapter } from './DeepSeekAdapter';

export class AdapterFactory {
  static createAdapter(modelInfo: ModelInfo): IAIModelAdapter {
    const { adapter, apiKeyEnv, baseUrlEnv } = modelInfo;

    switch (adapter) {
      case 'claude': {
        const envKey = apiKeyEnv || 'ANTHROPIC_API_KEY';
        const apiKey = process.env[envKey];
        if (!apiKey) {
          throw new Error(`${envKey} is not set`);
        }
        return new ClaudeAdapter(apiKey);
      }
      case 'deepseek': {
        const keyEnv = apiKeyEnv || 'DEEPSEEK_API_KEY';
        const urlEnv = baseUrlEnv || 'DEEPSEEK_BASE_URL';
        const apiKey = process.env[keyEnv];
        const baseUrl = process.env[urlEnv];
        if (!apiKey) {
          throw new Error(`${keyEnv} is not set`);
        }
        if (!baseUrl) {
          throw new Error(`${urlEnv} is not set`);
        }
        return new DeepSeekAdapter(apiKey, baseUrl);
      }
      default:
        throw new Error(`Unsupported adapter type: ${adapter}`);
    }
  }
}
