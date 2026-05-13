import { ModelInfo, Message, ChatOptions, RoundtableResult } from '../types';
import { AdapterFactory } from '../adapters/AdapterFactory';

export class RoundtableScheduler {
  static async runRoundtable(
    modelIds: string[],
    messages: Message[],
    options?: ChatOptions
  ): Promise<RoundtableResult[]> {
    const results: RoundtableResult[] = [];

    const promises = modelIds.map(async (modelId) => {
      try {
        const modelInfo = await this.getModelInfo(modelId);
        if (!modelInfo) {
          return {
            modelId,
            content: '',
            status: 'error' as const,
            error: 'Model not found',
          };
        }

        const adapter = AdapterFactory.createAdapter(modelInfo);
        const response = await adapter.chat(messages, options);

        return {
          modelId,
          content: response.content,
          status: 'success' as const,
        };
      } catch (error) {
        return {
          modelId,
          content: '',
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    const settledResults = await Promise.allSettled(promises);

    settledResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          modelId: 'unknown',
          content: '',
          status: 'error',
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        });
      }
    });

    return results;
  }

  private static async getModelInfo(modelId: string): Promise<ModelInfo | undefined> {
    const { MODEL_REGISTRY } = await import('../config/models');
    return MODEL_REGISTRY.find((model) => model.id === modelId);
  }
}
