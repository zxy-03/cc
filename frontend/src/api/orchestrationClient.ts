import { SubTask, ExpertAgent, TaskBreakdownResult, AssignmentPlan, ExecutionResult, FinalSummary } from '../types/coordination';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const orchestrationAPI = {
  async breakdownTask(userRequest: string): Promise<TaskBreakdownResult> {
    const response = await fetch(`${API_BASE_URL}/orchestration/breakdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_request: userRequest }),
    });

    if (!response.ok) {
      throw new Error('Failed to breakdown task');
    }

    return response.json();
  },

  async regenerateSubTask(
    originalRequest: string,
    taskId: string,
    feedback?: string
  ): Promise<TaskBreakdownResult> {
    const response = await fetch(`${API_BASE_URL}/orchestration/breakdown/regenerate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        original_request: originalRequest,
        task_id: taskId,
        feedback,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to regenerate subtask');
    }

    return response.json();
  },

  async getAgents(): Promise<{ success: boolean; agents: ExpertAgent[] }> {
    const response = await fetch(`${API_BASE_URL}/orchestration/agents`);

    if (!response.ok) {
      throw new Error('Failed to get agents');
    }

    return response.json();
  },

  async getAvailableAgents(): Promise<{ success: boolean; agents: ExpertAgent[] }> {
    const response = await fetch(`${API_BASE_URL}/orchestration/agents/available`);

    if (!response.ok) {
      throw new Error('Failed to get available agents');
    }

    return response.json();
  },

  async recommendAgents(
    requiredSkills: string[],
    excludeBusy: boolean = true
  ): Promise<{ success: boolean; agents: ExpertAgent[] }> {
    const response = await fetch(`${API_BASE_URL}/orchestration/agents/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        required_skills: requiredSkills,
        exclude_busy: excludeBusy,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to recommend agents');
    }

    return response.json();
  },

  async validateTasks(tasks: SubTask[]): Promise<{ valid: boolean; errors: string[] }> {
    const response = await fetch(`${API_BASE_URL}/orchestration/orchestrator/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tasks }),
    });

    if (!response.ok) {
      throw new Error('Failed to validate tasks');
    }

    return response.json();
  },

  async getExecutionPlan(tasks: SubTask[]): Promise<{
    success: boolean;
    recommendations: Record<string, ExpertAgent[]>;
    execution_plan: any;
    stats: any;
  }> {
    const response = await fetch(`${API_BASE_URL}/orchestration/orchestrator/plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tasks }),
    });

    if (!response.ok) {
      throw new Error('Failed to get execution plan');
    }

    return response.json();
  },

  async createAssignmentPlan(
    tasks: SubTask[],
    assignments: Map<string, string>
  ): Promise<{ success: boolean; plan: AssignmentPlan }> {
    const response = await fetch(`${API_BASE_URL}/orchestration/orchestrator/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tasks,
        assignments: Object.fromEntries(assignments),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create assignment plan');
    }

    return response.json();
  },

  async startExecution(tasks: SubTask[]): Promise<{
    success: boolean;
    results: ExecutionResult[];
    completed_tasks: SubTask[];
    failed_tasks: SubTask[];
  }> {
    const response = await fetch(`${API_BASE_URL}/orchestration/execution/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tasks }),
    });

    if (!response.ok) {
      throw new Error('Failed to start execution');
    }

    return response.json();
  },

  async retryTask(
    taskId: string,
    tasks: SubTask[],
    agentId: string
  ): Promise<{ success: boolean; result: ExecutionResult }> {
    const response = await fetch(`${API_BASE_URL}/orchestration/execution/retry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task_id: taskId,
        tasks,
        agent_id: agentId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to retry task');
    }

    return response.json();
  },

  async generateSummary(
    originalRequest: string,
    executionResults: ExecutionResult[],
    tasks: SubTask[]
  ): Promise<{ success: boolean; summary: FinalSummary }> {
    const response = await fetch(`${API_BASE_URL}/orchestration/summary/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        original_request: originalRequest,
        execution_results: executionResults,
        tasks,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate summary');
    }

    return response.json();
  },

  async regenerateSummary(
    originalRequest: string,
    executionResults: ExecutionResult[],
    tasks: SubTask[],
    feedback?: string
  ): Promise<{ success: boolean; summary: FinalSummary }> {
    const response = await fetch(`${API_BASE_URL}/orchestration/summary/regenerate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        original_request: originalRequest,
        execution_results: executionResults,
        tasks,
        feedback,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to regenerate summary');
    }

    return response.json();
  },
};
