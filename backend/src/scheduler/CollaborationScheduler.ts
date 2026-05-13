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

    parsedTasks.forEach((parsedTask, index) => {
      const modelId = modelIds[index % modelIds.length];
      const taskName = parsedTask.name;

      tasks.push({
        taskId: `task-${index + 1}`,
        taskType: 'analysis',
        taskDescription: `${parsedTask.description}\n\n原始问题：${mainQuestion}`,
        modelId: modelId,
        role: taskName,
      });
    });

    return tasks;
  }

  private static generateDefaultTasks(mainQuestion: string, modelIds: string[]): TaskAssignment[] {
    const tasks: TaskAssignment[] = [];

    const taskTemplates: { description: string }[] = [
      { description: '分析问题，识别关键要点和核心需求' },
      { description: '深入解释相关概念和背景知识' },
      { description: '提供创造性的视角和解决方案' },
      { description: '验证信息准确性和数据来源' },
      { description: '总结关键点和核心结论' },
    ];

    modelIds.forEach((modelId, index) => {
      const templateIndex = index % taskTemplates.length;
      const template = taskTemplates[templateIndex];
      const taskName = `任务${String.fromCharCode(65 + templateIndex)}`;

      tasks.push({
        taskId: `task-${index + 1}`,
        taskType: 'analysis',
        taskDescription: `${template.description}。\n\n原始问题：${mainQuestion}`,
        modelId: modelId,
        role: taskName,
      });
    });

    return tasks;
  }

  private static buildTaskMessage(task: TaskAssignment): Message[] {
    return [
      {
        role: 'system',
        content: `你正在参与一个协作任务。\n\n你的任务：${task.taskDescription}`,
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