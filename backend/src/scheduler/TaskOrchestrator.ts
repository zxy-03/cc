import { SubTask, AssignmentPlan, ExpertAgent } from '../types/coordination';
import { EXPERT_AGENTS_POOL, recommendAgentsForTask } from '../config/expertAgents';

const DEBUG = process.env.NODE_ENV !== 'production';

export class TaskOrchestrator {
  private static validateDependencies(tasks: SubTask[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const taskIds = new Set(tasks.map(t => t.id));

    for (const task of tasks) {
      for (const depId of task.dependencies) {
        if (!taskIds.has(depId)) {
          errors.push(`任务 ${task.id} 依赖的任务 ${depId} 不存在`);
        }
      }

      if (this.hasCircularDependency(tasks, task.id, new Set())) {
        errors.push(`任务 ${task.id} 存在循环依赖`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private static hasCircularDependency(
    tasks: SubTask[],
    currentTaskId: string,
    visited: Set<string>
  ): boolean {
    if (visited.has(currentTaskId)) {
      return true;
    }

    visited.add(currentTaskId);
    const task = tasks.find(t => t.id === currentTaskId);

    if (!task) {
      return false;
    }

    for (const depId of task.dependencies) {
      if (this.hasCircularDependency(tasks, depId, new Set(visited))) {
        return true;
      }
    }

    return false;
  }

  private static getExecutionOrder(tasks: SubTask[]): string[] {
    const inDegree: Map<string, number> = new Map();
    const adjacencyList: Map<string, string[]> = new Map();
    const taskIds = tasks.map(t => t.id);

    taskIds.forEach(id => {
      inDegree.set(id, 0);
      adjacencyList.set(id, []);
    });

    tasks.forEach(task => {
      task.dependencies.forEach(depId => {
        adjacencyList.get(depId)?.push(task.id);
        inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
      });
    });

    const queue: string[] = [];
    inDegree.forEach((degree, taskId) => {
      if (degree === 0) {
        queue.push(taskId);
      }
    });

    const executionOrder: string[] = [];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      executionOrder.push(currentId);

      const neighbors = adjacencyList.get(currentId) || [];
      neighbors.forEach(neighborId => {
        const newDegree = (inDegree.get(neighborId) || 0) - 1;
        inDegree.set(neighborId, newDegree);
        if (newDegree === 0) {
          queue.push(neighborId);
        }
      });
    }

    if (executionOrder.length !== taskIds.length) {
      throw new Error('存在循环依赖，无法确定执行顺序');
    }

    return executionOrder;
  }

  private static getParallelGroups(executionOrder: string[], tasks: SubTask[]): string[][] {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const completedTasks = new Set<string>();
    const groups: string[][] = [];
    let remainingTasks = [...executionOrder];

    while (remainingTasks.length > 0) {
      const currentGroup: string[] = [];
      const nextRemaining: string[] = [];

      for (const taskId of remainingTasks) {
        const task = taskMap.get(taskId)!;
        const dependenciesMet = task.dependencies.every(depId => completedTasks.has(depId));

        if (dependenciesMet) {
          currentGroup.push(taskId);
        } else {
          nextRemaining.push(taskId);
        }
      }

      if (currentGroup.length === 0) {
        throw new Error('无法确定并行分组，可能存在依赖问题');
      }

      groups.push(currentGroup);
      currentGroup.forEach(id => completedTasks.add(id));
      remainingTasks = nextRemaining;
    }

    return groups;
  }

  static validateTaskBreakdown(tasks: SubTask[]): { valid: boolean; errors: string[] } {
    return this.validateDependencies(tasks);
  }

  static generateAutoRecommendations(tasks: SubTask[]): Map<string, ExpertAgent[]> {
    const recommendations = new Map<string, ExpertAgent[]>();

    for (const task of tasks) {
      const recommendedAgents = recommendAgentsForTask(task.required_skills.join(','));
      recommendations.set(task.id, recommendedAgents);
    }

    if (DEBUG) {
      console.log('[TaskOrchestrator] Generated recommendations for', recommendations.size, 'tasks');
    }

    return recommendations;
  }

  static createAssignmentPlan(
    tasks: SubTask[],
    assignments: Map<string, string>
  ): AssignmentPlan {
    const planTasks = tasks.map(task => ({
      taskId: task.id,
      agentId: assignments.get(task.id) || '',
      priority: task.dependencies.length,
    }));

    return {
      tasks: planTasks,
      created_at: new Date().toISOString(),
      created_by: 'human',
    };
  }

  static getExecutionPlan(tasks: SubTask[]): {
    executionOrder: string[];
    parallelGroups: string[][];
  } {
    const validation = this.validateDependencies(tasks);
    if (!validation.valid) {
      throw new Error(`任务依赖验证失败: ${validation.errors.join(', ')}`);
    }

    const executionOrder = this.getExecutionOrder(tasks);
    const parallelGroups = this.getParallelGroups(executionOrder, tasks);

    if (DEBUG) {
      console.log('[TaskOrchestrator] Execution order:', executionOrder);
      console.log('[TaskOrchestrator] Parallel groups:', parallelGroups);
    }

    return {
      executionOrder,
      parallelGroups,
    };
  }

  static getReadyTasks(tasks: SubTask[], completedTaskIds: Set<string>): SubTask[] {
    return tasks.filter(task => {
      if (task.status !== 'pending' && task.status !== 'assigned') {
        return false;
      }

      return task.dependencies.every(depId => completedTaskIds.has(depId));
    });
  }

  static canExecuteTask(task: SubTask, completedTaskIds: Set<string>): boolean {
    return task.dependencies.every(depId => completedTaskIds.has(depId));
  }

  static getTaskDependencies(taskId: string, tasks: SubTask[]): SubTask[] {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      return [];
    }

    return tasks.filter(t => task.dependencies.includes(t.id));
  }

  static getTaskDependents(taskId: string, tasks: SubTask[]): SubTask[] {
    return tasks.filter(t => t.dependencies.includes(taskId));
  }

  static updateTaskStatus(
    tasks: SubTask[],
    taskId: string,
    status: SubTask['status'],
    output?: string,
    error?: string
  ): SubTask[] {
    return tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status,
          output,
          error,
        };
      }
      return task;
    });
  }

  static assignAgentToTask(
    tasks: SubTask[],
    taskId: string,
    agentId: string
  ): SubTask[] {
    return tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          assigned_agent: agentId,
          status: 'assigned',
        };
      }
      return task;
    });
  }

  static getExecutionStats(tasks: SubTask[]): {
    total: number;
    pending: number;
    assigned: number;
    in_progress: number;
    completed: number;
    failed: number;
  } {
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      assigned: tasks.filter(t => t.status === 'assigned').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
    };
  }
}
