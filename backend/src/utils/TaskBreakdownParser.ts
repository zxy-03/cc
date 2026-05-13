import { AdapterFactory } from '../adapters/AdapterFactory';
import { ModelInfo } from '../types';
import { TaskBreakdownResult, SubTask, TaskType } from '../types/coordination';

const DEBUG = process.env.NODE_ENV !== 'production';

export class TaskBreakdownParser {
  private static getModelInfo(): ModelInfo | undefined {
    const { MODEL_REGISTRY } = require('../config/models');
    return MODEL_REGISTRY.find((model: ModelInfo) => model.id === 'claude-3.5-sonnet');
  }

  private static generateBreakdownPrompt(userRequest: string): string {
    return `你是一个专业的任务规划器，负责将复杂的用户需求拆解为可执行的子任务。

用户需求：${userRequest}

请按照以下要求进行任务拆解：

1. **任务拆解原则**：
   - 将复杂需求分解为3-8个可独立执行的原子任务
   - 每个任务应该有明确的输入和输出
   - 任务之间应该有合理的依赖关系
   - 避免任务过于细碎或过于宽泛

2. **任务类型分类**：
   - data-collection: 数据搜集型（需要检索、收集信息）
   - case-study: 调研分析型（需要分析案例、研究）
   - trend-prediction: 推演写作型（需要预测、推断）
   - report-writing: 总结整合型（需要整合、撰写报告）
   - analysis: 分析型（需要分析问题）
   - creative-writing: 创意型（需要创意内容）
   - fact-checking: 核查型（需要验证信息）
   - summarization: 总结型（需要总结归纳）

3. **输出格式**：
请以JSON格式输出，包含以下字段：
{
  "tasks": [
    {
      "id": "task1",
      "title": "任务标题",
      "description": "详细描述任务内容和目标",
      "required_skills": ["技能1", "技能2"],
      "estimated_type": "任务类型",
      "dependencies": []
    }
  ]
}

4. **依赖关系说明**：
   - dependencies: 数组，包含该任务依赖的前置任务ID
   - 例如：["task1", "task2"] 表示该任务需要task1和task2完成后才能开始
   - 无依赖的任务使用空数组 []

5. **技能标签参考**：
   - 数据检索、数据分析、信息挖掘、网络搜索
   - 案例研究、商业分析、市场调研、竞争分析
   - 趋势预测、批判性思维、战略规划、风险评估
   - 长文写作、排版整合、内容策划、编辑润色
   - 代码生成、代码调试、代码审查、技术文档
   - 事实核查、数据验证、信息确认、质量把控
   - 创意写作、文案策划、内容营销、品牌传播
   - 总结归纳、要点提炼、结论汇总、信息压缩

请直接输出JSON，不要包含任何其他文字。`;
  }

  private static parseJSONResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON found in response');
    } catch (error) {
      if (DEBUG) console.error('[TaskBreakdownParser] JSON parse error:', error);
      throw new Error('Failed to parse task breakdown response');
    }
  }

  private static validateSubTask(task: any): SubTask | null {
    if (!task.id || !task.title || !task.description || !task.estimated_type) {
      if (DEBUG) console.warn('[TaskBreakdownParser] Invalid task structure:', task);
      return null;
    }

    const validTypes: TaskType[] = [
      'data-collection',
      'case-study',
      'trend-prediction',
      'report-writing',
      'analysis',
      'creative-writing',
      'fact-checking',
      'summarization',
    ];

    if (!validTypes.includes(task.estimated_type)) {
      if (DEBUG) console.warn('[TaskBreakdownParser] Invalid task type:', task.estimated_type);
      return null;
    }

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      required_skills: Array.isArray(task.required_skills) ? task.required_skills : [],
      estimated_type: task.estimated_type,
      dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
      status: 'pending',
    };
  }

  static async breakdownTask(userRequest: string): Promise<TaskBreakdownResult> {
    if (DEBUG) console.log('[TaskBreakdownParser] Starting task breakdown for:', userRequest);

    try {
      const modelInfo = this.getModelInfo();
      if (!modelInfo) {
        throw new Error('Parser model not found');
      }

      const adapter = AdapterFactory.createAdapter(modelInfo);
      const prompt = this.generateBreakdownPrompt(userRequest);

      if (DEBUG) console.log('[TaskBreakdownParser] Sending prompt to parser AI');

      const response = await adapter.chat([
        {
          role: 'system',
          content: '你是一个专业的任务规划器，擅长将复杂需求拆解为可执行的子任务。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      if (DEBUG) console.log('[TaskBreakdownParser] Received response from parser AI');

      const parsedResponse = this.parseJSONResponse(response.content);

      if (!parsedResponse.tasks || !Array.isArray(parsedResponse.tasks)) {
        throw new Error('Invalid response structure: missing tasks array');
      }

      const subtasks: SubTask[] = [];
      for (const task of parsedResponse.tasks) {
        const validatedTask = this.validateSubTask(task);
        if (validatedTask) {
          subtasks.push(validatedTask);
        }
      }

      if (subtasks.length === 0) {
        throw new Error('No valid tasks were parsed from the response');
      }

      if (DEBUG) {
        console.log('[TaskBreakdownParser] Successfully parsed', subtasks.length, 'subtasks');
        console.log('[TaskBreakdownParser] Subtasks:', subtasks.map(t => ({ id: t.id, title: t.title })));
      }

      return {
        success: true,
        subtasks,
        original_request: userRequest,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (DEBUG) console.error('[TaskBreakdownParser] Error:', errorMessage);

      return {
        success: false,
        subtasks: [],
        original_request: userRequest,
        error: errorMessage,
      };
    }
  }

  static async regenerateSubTask(
    originalRequest: string,
    taskId: string,
    feedback?: string
  ): Promise<TaskBreakdownResult> {
    const additionalPrompt = feedback
      ? `\n\n用户反馈：${feedback}\n\n请根据反馈重新生成任务 ${taskId}`
      : `\n\n请重新生成任务 ${taskId}`;

    const enhancedRequest = originalRequest + additionalPrompt;

    return this.breakdownTask(enhancedRequest);
  }
}
