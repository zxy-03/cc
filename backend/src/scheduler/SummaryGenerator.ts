import { AdapterFactory } from '../adapters/AdapterFactory';
import { ModelInfo } from '../types';
import { SubTask, ExecutionResult, FinalSummary } from '../types/coordination';

const DEBUG = process.env.NODE_ENV !== 'production';

export class SummaryGenerator {
  private static getModelInfo(): ModelInfo | undefined {
    const { MODEL_REGISTRY } = require('../config/models');
    return MODEL_REGISTRY.find((model: ModelInfo) => model.id === 'claude-3-opus');
  }

  private static generateSummaryPrompt(
    originalRequest: string,
    executionResults: ExecutionResult[],
    tasks: SubTask[]
  ): string {
    let prompt = `你是一位专业的汇总编辑，负责将多个子任务的输出整合为一份完整、连贯的最终成果。

原始用户需求：${originalRequest}

以下是各个子任务的执行结果：\n\n`;

    executionResults.forEach((result, index) => {
      const task = tasks.find(t => t.id === result.taskId);
      prompt += `--- 子任务 ${index + 1}：${task?.title || result.taskId} ---\n`;
      prompt += `任务描述：${task?.description || '无描述'}\n`;
      prompt += `执行结果：\n${result.output}\n\n`;
    });

    prompt += `\n请根据以上信息完成以下任务：\n`;
    prompt += `1. 过滤重复信息，解决矛盾，填补逻辑缺口\n`;
    prompt += `2. 按照要求的结构将各任务的成果编织成流畅连贯的最终输出\n`;
    prompt += `3. 确保最终输出完整回应原始用户需求\n`;
    prompt += `4. 在适当位置标注引用来源（来自哪个子任务），方便回溯\n`;
    prompt += `5. 使用清晰的结构和专业的语言\n\n`;

    prompt += `请直接输出整合后的最终成果，不要包含任何额外的解释或说明。`;

    return prompt;
  }

  private static generateContributionSummaries(
    executionResults: ExecutionResult[],
    tasks: SubTask[]
  ): Array<{ taskId: string; contribution_summary: string }> {
    return executionResults.map(result => {
      const task = tasks.find(t => t.id === result.taskId);
      const summary = result.output
        .split('\n')
        .slice(0, 3)
        .join(' ')
        .substring(0, 200);

      return {
        taskId: result.taskId,
        contribution_summary: summary || task?.description || '无贡献摘要',
      };
    });
  }

  static async generateFinalSummary(
    originalRequest: string,
    executionResults: ExecutionResult[],
    tasks: SubTask[]
  ): Promise<FinalSummary> {
    if (DEBUG) {
      console.log('[SummaryGenerator] Starting final summary generation');
    }

    const startTime = Date.now();

    try {
      const modelInfo = this.getModelInfo();
      if (!modelInfo) {
        throw new Error('Summary model not found');
      }

      const adapter = AdapterFactory.createAdapter(modelInfo);
      const prompt = this.generateSummaryPrompt(originalRequest, executionResults, tasks);

      if (DEBUG) {
        console.log('[SummaryGenerator] Sending prompt to summary AI');
      }

      const response = await adapter.chat([
        {
          role: 'system',
          content: '你是一位专业的汇总编辑，擅长整合多个来源的信息，生成连贯、完整的最终成果。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      const executionTime = Date.now() - startTime;

      if (DEBUG) {
        console.log('[SummaryGenerator] Summary generated in', executionTime, 'ms');
      }

      const taskContributions = this.generateContributionSummaries(executionResults, tasks);

      return {
        original_request: originalRequest,
        consolidated_output: response.content,
        task_contributions: taskContributions,
        metadata: {
          total_tasks: tasks.length,
          completed_tasks: executionResults.filter(r => r.status === 'success').length,
          total_time: executionTime,
          created_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (DEBUG) {
        console.error('[SummaryGenerator] Error generating summary:', errorMessage);
      }

      throw new Error(`Failed to generate final summary: ${errorMessage}`);
    }
  }

  static async regenerateSummary(
    originalRequest: string,
    executionResults: ExecutionResult[],
    tasks: SubTask[],
    feedback?: string
  ): Promise<FinalSummary> {
    if (DEBUG) {
      console.log('[SummaryGenerator] Regenerating summary with feedback');
    }

    const startTime = Date.now();

    try {
      const modelInfo = this.getModelInfo();
      if (!modelInfo) {
        throw new Error('Summary model not found');
      }

      const adapter = AdapterFactory.createAdapter(modelInfo);
      let prompt = this.generateSummaryPrompt(originalRequest, executionResults, tasks);

      if (feedback) {
        prompt = `${prompt}\n\n用户反馈：${feedback}\n\n请根据用户反馈重新生成最终成果。`;
      }

      if (DEBUG) {
        console.log('[SummaryGenerator] Sending prompt with feedback to summary AI');
      }

      const response = await adapter.chat([
        {
          role: 'system',
          content: '你是一位专业的汇总编辑，擅长整合多个来源的信息，生成连贯、完整的最终成果。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      const executionTime = Date.now() - startTime;

      if (DEBUG) {
        console.log('[SummaryGenerator] Summary regenerated in', executionTime, 'ms');
      }

      const taskContributions = this.generateContributionSummaries(executionResults, tasks);

      return {
        original_request: originalRequest,
        consolidated_output: response.content,
        task_contributions: taskContributions,
        metadata: {
          total_tasks: tasks.length,
          completed_tasks: executionResults.filter(r => r.status === 'success').length,
          total_time: executionTime,
          created_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (DEBUG) {
        console.error('[SummaryGenerator] Error regenerating summary:', errorMessage);
      }

      throw new Error(`Failed to regenerate summary: ${errorMessage}`);
    }
  }
}
