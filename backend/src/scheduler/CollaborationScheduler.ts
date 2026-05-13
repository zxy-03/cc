import { ModelInfo, Message, ChatOptions } from '../types';
import { TaskAssignment, CoordinationPlan, CoordinationResult, TaskResult, TaskType, ParsedTask } from '../types/coordination';
import { AdapterFactory } from '../adapters/AdapterFactory';
import { TaskParser } from '../utils/TaskParser';

export class CollaborationScheduler {
  private static getModelInfo(modelId: string): ModelInfo | undefined {
    const { MODEL_REGISTRY } = require('../config/models');
    return MODEL_REGISTRY.find((model: ModelInfo) => model.id === modelId);
  }

  private static generateTasksFromParsed(
    parsedTasks: ParsedTask[],
    mainQuestion: string,
    modelIds: string[]
  ): TaskAssignment[] {
    const tasks: TaskAssignment[] = [];

    const roleMapping: Record<string, { type: TaskType; role: string }> = {
      '分析': { type: 'analysis', role: 'analyst' },
      '创意': { type: 'creative-writing', role: 'creative' },
      '总结': { type: 'summarization', role: 'summarizer' },
      '核查': { type: 'fact-checking', role: 'fact-checker' },
      '解释': { type: 'detailed-explanation', role: 'writer' },
      '写': { type: 'detailed-explanation', role: 'writer' },
    };

    parsedTasks.forEach((parsedTask, index) => {
      const modelId = modelIds[index % modelIds.length];

      let roleInfo = { type: 'analysis' as TaskType, role: 'analyst' };
      for (const [keyword, info] of Object.entries(roleMapping)) {
        if (parsedTask.name.includes(keyword) || parsedTask.description.includes(keyword)) {
          roleInfo = info;
          break;
        }
      }

      tasks.push({
        taskId: `task-${index + 1}`,
        taskType: roleInfo.type,
        taskDescription: `${parsedTask.description}\n\n原始问题：${mainQuestion}`,
        modelId: modelId,
        role: roleInfo.role,
      });
    });

    return tasks;
  }

  private static generateDefaultTasks(mainQuestion: string, modelIds: string[]): TaskAssignment[] {
    const tasks: TaskAssignment[] = [];

    const taskTemplates: { type: TaskType; description: string; role: string }[] = [
      { type: 'analysis', description: '分析问题，识别关键要点和核心需求', role: 'analyst' },
      { type: 'detailed-explanation', description: '深入解释相关概念和背景知识', role: 'writer' },
      { type: 'creative-writing', description: '提供创造性的视角和解决方案', role: 'creative' },
      { type: 'fact-checking', description: '验证信息准确性和数据来源', role: 'fact-checker' },
      { type: 'summarization', description: '总结关键点和核心结论', role: 'summarizer' },
    ];

    modelIds.forEach((modelId, index) => {
      const modelInfo = this.getModelInfo(modelId);
      if (!modelInfo) return;

      const modelRole = modelInfo.role || 'general';
      const templateIndex = index % taskTemplates.length;
      const template = taskTemplates[templateIndex];

      tasks.push({
        taskId: `task-${index + 1}`,
        taskType: template.type,
        taskDescription: `${template.description}。\n\n原始问题：${mainQuestion}`,
        modelId: modelId,
        role: modelRole,
      });
    });

    return tasks;
  }

  private static buildTaskMessage(task: TaskAssignment): Message[] {
    const roleDescriptions: Record<string, string> = {
      analyst: '你是一位专业分析师，擅长拆解复杂问题并识别关键要点。',
      creative: '你是一位创意专家，擅长从独特视角提供创新解决方案。',
      summarizer: '你是一位专业总结者，擅长提炼核心信息和关键点。',
      'fact-checker': '你是一位事实核查专家，擅长验证信息的准确性。',
      writer: '你是一位专业写作者，擅长深入解释和阐述复杂概念。',
      general: '你是一位全能助手，能够处理各种类型的任务。',
    };

    return [
      {
        role: 'system',
        content: `${roleDescriptions[task.role]}\n\n你的任务：${task.taskDescription}`,
      },
      {
        role: 'user',
        content: '请针对上述任务提供专业的回答。',
      },
    ];
  }

  static async runCollaboration(
    modelIds: string[],
    mainQuestion: string,
    options?: ChatOptions
  ): Promise<CoordinationResult> {
    const parseResult = TaskParser.parseTaskFromPrompt(mainQuestion);

    let tasks: TaskAssignment[];
    let actualMainQuestion: string;

    if (parseResult.success && parseResult.tasks.length > 0) {
      tasks = this.generateTasksFromParsed(parseResult.tasks, parseResult.mainQuestion, modelIds);
      actualMainQuestion = parseResult.mainQuestion;
    } else {
      tasks = this.generateDefaultTasks(mainQuestion, modelIds);
      actualMainQuestion = mainQuestion;
    }

    const plan: CoordinationPlan = {
      mode: 'divided',
      mainQuestion: actualMainQuestion,
      tasks: tasks,
    };

    const taskResults: TaskResult[] = [];

    const promises = plan.tasks.map(async (task) => {
      try {
        const modelInfo = this.getModelInfo(task.modelId);
        if (!modelInfo) {
          return {
            taskId: task.taskId,
            modelId: task.modelId,
            content: '',
            status: 'error' as const,
            error: 'Model not found',
          };
        }

        const adapter = AdapterFactory.createAdapter(modelInfo);
        const messages = this.buildTaskMessage(task);
        const response = await adapter.chat(messages, options);

        return {
          taskId: task.taskId,
          modelId: task.modelId,
          content: response.content,
          status: 'success' as const,
        };
      } catch (error) {
        return {
          taskId: task.taskId,
          modelId: task.modelId,
          content: '',
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    const settledResults = await Promise.allSettled(promises);

    settledResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        taskResults.push(result.value);
      } else {
        taskResults.push({
          taskId: 'unknown',
          modelId: 'unknown',
          content: '',
          status: 'error',
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        });
      }
    });

    return {
      plan,
      taskResults,
    };
  }

  static parsePrompt(prompt: string) {
    return TaskParser.parseTaskFromPrompt(prompt);
  }
}