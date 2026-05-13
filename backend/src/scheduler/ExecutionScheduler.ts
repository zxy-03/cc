import { SubTask, ExecutionResult, ExpertAgent } from '../types/coordination';
import { AdapterFactory } from '../adapters/AdapterFactory';
import { ModelInfo } from '../types';
import { getAgentById } from '../config/expertAgents';
import { TaskOrchestrator } from './TaskOrchestrator';

const DEBUG = process.env.NODE_ENV !== 'production';

export class ExecutionScheduler {
  private static getModelInfo(modelId: string): ModelInfo | undefined {
    const { MODEL_REGISTRY } = require('../config/models');
    return MODEL_REGISTRY.find((model: ModelInfo) => model.id === modelId);
  }

  private static buildTaskPrompt(task: SubTask, previousOutputs?: Map<string, string>): string {
    let prompt = `你正在执行任务：${task.title}\n\n`;
    prompt += `任务描述：${task.description}\n\n`;

    if (task.required_skills.length > 0) {
      prompt += `所需技能：${task.required_skills.join('、')}\n\n`;
    }

    if (previousOutputs && task.dependencies.length > 0) {
      prompt += `前置任务输出：\n`;
      task.dependencies.forEach(depId => {
        const output = previousOutputs.get(depId);
        if (output) {
          prompt += `\n--- 任务 ${depId} 的输出 ---\n${output}\n--- 结束 ---\n`;
        }
      });
    }

    prompt += `\n请根据以上信息完成你的任务，提供专业、详细的回答。`;

    return prompt;
  }

  private static async executeSingleTask(
    task: SubTask,
    agent: ExpertAgent,
    previousOutputs?: Map<string, string>
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    if (DEBUG) {
      console.log(`[ExecutionScheduler] Starting task ${task.id} with agent ${agent.id}`);
    }

    try {
      const modelInfo = this.getModelInfo(agent.model_id);
      if (!modelInfo) {
        throw new Error(`Model ${agent.model_id} not found`);
      }

      const adapter = AdapterFactory.createAdapter(modelInfo);
      const prompt = this.buildTaskPrompt(task, previousOutputs);

      const response = await adapter.chat([
        {
          role: 'system',
          content: `你是一位${agent.name}，${agent.description}。你的专长包括：${agent.skills.join('、')}。`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      const executionTime = Date.now() - startTime;

      if (DEBUG) {
        console.log(`[ExecutionScheduler] Task ${task.id} completed in ${executionTime}ms`);
      }

      return {
        taskId: task.id,
        agentId: agent.id,
        output: response.content,
        status: 'success',
        execution_time: executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (DEBUG) {
        console.error(`[ExecutionScheduler] Task ${task.id} failed:`, errorMessage);
      }

      return {
        taskId: task.id,
        agentId: agent.id,
        output: '',
        status: 'error',
        execution_time: executionTime,
        error: errorMessage,
      };
    }
  }

  static async executeTasks(
    tasks: SubTask[],
    onProgress?: (taskId: string, status: SubTask['status']) => void
  ): Promise<{
    results: ExecutionResult[];
    completedTasks: SubTask[];
    failedTasks: SubTask[];
  }> {
    if (DEBUG) {
      console.log('[ExecutionScheduler] Starting execution of', tasks.length, 'tasks');
    }

    const executionPlan = TaskOrchestrator.getExecutionPlan(tasks);
    const results: ExecutionResult[] = [];
    const taskOutputs = new Map<string, string>();
    const completedTaskIds = new Set<string>();

    for (const group of executionPlan.parallelGroups) {
      if (DEBUG) {
        console.log('[ExecutionScheduler] Executing parallel group:', group);
      }

      const groupPromises = group.map(async (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) {
          throw new Error(`Task ${taskId} not found`);
        }

        if (!task.assigned_agent) {
          throw new Error(`Task ${taskId} has no assigned agent`);
        }

        const agent = getAgentById(task.assigned_agent);
        if (!agent) {
          throw new Error(`Agent ${task.assigned_agent} not found`);
        }

        if (onProgress) {
          onProgress(taskId, 'in_progress');
        }

        const result = await this.executeSingleTask(task, agent, taskOutputs);

        if (result.status === 'success') {
          taskOutputs.set(taskId, result.output);
          completedTaskIds.add(taskId);
        }

        if (onProgress) {
          onProgress(taskId, result.status === 'success' ? 'completed' : 'failed');
        }

        return { taskId, result };
      });

      const groupResults = await Promise.allSettled(groupPromises);

      for (const settled of groupResults) {
        if (settled.status === 'fulfilled') {
          results.push(settled.value.result);
        } else {
          if (DEBUG) {
            console.error('[ExecutionScheduler] Group execution error:', settled.reason);
          }
        }
      }
    }

    const completedTasks = tasks.filter(t => completedTaskIds.has(t.id));
    const failedTasks = tasks.filter(t => !completedTaskIds.has(t.id) && t.status !== 'pending');

    if (DEBUG) {
      console.log('[ExecutionScheduler] Execution completed:', {
        total: tasks.length,
        completed: completedTasks.length,
        failed: failedTasks.length,
      });
    }

    return {
      results,
      completedTasks,
      failedTasks,
    };
  }

  static async retryTask(
    task: SubTask,
    agent: ExpertAgent,
    previousOutputs?: Map<string, string>
  ): Promise<ExecutionResult> {
    if (DEBUG) {
      console.log(`[ExecutionScheduler] Retrying task ${task.id}`);
    }

    return this.executeSingleTask(task, agent, previousOutputs);
  }

  static async executeSingleTaskById(
    taskId: string,
    tasks: SubTask[],
    previousOutputs?: Map<string, string>
  ): Promise<ExecutionResult> {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (!task.assigned_agent) {
      throw new Error(`Task ${taskId} has no assigned agent`);
    }

    const agent = getAgentById(task.assigned_agent);
    if (!agent) {
      throw new Error(`Agent ${task.assigned_agent} not found`);
    }

    return this.executeSingleTask(task, agent, previousOutputs);
  }
}
