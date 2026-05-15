import { api } from './client';
import { DataTask, DataFlowExecutionResult, FinalAnalysisReport } from '../types/dataflow';

const API_BASE_URL = '/api';

export const dataflowAPI = {
  parseRequest: async (userRequest: string, dataSourceId?: string) => {
    const response = await fetch(`${API_BASE_URL}/dataflow/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Accept': 'application/json;charset=UTF-8',
      },
      body: JSON.stringify({ user_request: userRequest, data_source_id: dataSourceId }),
    });
    return response.json();
  },

  assignTasks: async (tasks: DataTask[]) => {
    const response = await api.post('/dataflow/assign', {
      tasks,
    });
    return response.data;
  },

  executeTasks: async (tasks: DataTask[], options?: { timeoutMs?: number; maxRetries?: number; parallelism?: number }, dataSourceId?: string) => {
    const response = await api.post('/dataflow/execute', {
      tasks,
      options,
      data_source_id: dataSourceId,
    });
    return response.data;
  },

  runWorkflow: async (userRequest: string, dataSourceId?: string) => {
    const response = await api.post('/dataflow/run', {
      user_request: userRequest,
      data_source_id: dataSourceId,
    });
    return response.data;
  },

  validateResults: async (results: DataFlowExecutionResult[], tasks: DataTask[]) => {
    const response = await api.post('/dataflow/validate', {
      results,
      tasks,
    });
    return response.data;
  },

  generateReport: async (
    originalRequest: string,
    results: DataFlowExecutionResult[],
    tasks: DataTask[],
    dataSourceId?: string
  ) => {
    const response = await api.post('/dataflow/report', {
      original_request: originalRequest,
      results,
      tasks,
      data_source_id: dataSourceId,
    });
    return response.data;
  },
};

export interface ParseResponse {
  success: boolean;
  tasks: DataTask[];
  dependency_graph: string[];
  error?: string;
}

export interface ExecuteResponse {
  success: boolean;
  results: DataFlowExecutionResult[];
  completedTasks: DataTask[];
  failedTasks: DataTask[];
  executionStats?: {
    totalTime: number;
    avgTime: number;
    minTime: number;
    maxTime: number;
  };
}

export interface WorkflowResponse {
  success: boolean;
  report?: FinalAnalysisReport;
  tasks?: DataTask[];
  execution_results?: DataFlowExecutionResult[];
  error?: string;
}