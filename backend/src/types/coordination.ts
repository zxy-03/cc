export type TaskType = 'analysis' | 'creative-writing' | 'fact-checking' | 'summarization' | 'detailed-explanation' | 'data-collection' | 'case-study' | 'trend-prediction' | 'report-writing';

export interface TaskAssignment {
  taskId: string;
  taskType: TaskType;
  taskDescription: string;
  modelId: string;
  role: string;
}

export interface CoordinationPlan {
  mode: 'collaborative' | 'divided';
  mainQuestion: string;
  tasks: TaskAssignment[];
}

export interface CoordinationResult {
  plan: CoordinationPlan;
  taskResults: TaskResult[];
  finalSummary?: string;
}

export interface TaskResult {
  taskId: string;
  modelId: string;
  content: string;
  status: 'success' | 'error';
  error?: string;
}

export interface ParsedTask {
  name: string;
  description: string;
}

export interface TaskParseResult {
  success: boolean;
  tasks: ParsedTask[];
  mainQuestion: string;
  error?: string;
}

export interface SubTask {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  estimated_type: TaskType;
  dependencies: string[];
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  assigned_agent?: string;
  output?: string;
  error?: string;
}

export interface TaskBreakdownResult {
  success: boolean;
  subtasks: SubTask[];
  original_request: string;
  error?: string;
}

export interface ExpertAgent {
  id: string;
  name: string;
  description: string;
  skills: string[];
  model_id: string;
  capabilities: string[];
  status: 'idle' | 'busy';
  estimated_time?: number;
}

export interface AssignmentPlan {
  tasks: {
    taskId: string;
    agentId: string;
    priority: number;
  }[];
  created_at: string;
  created_by: 'human' | 'system';
}

export interface ExecutionResult {
  taskId: string;
  agentId: string;
  output: string;
  status: 'success' | 'error';
  execution_time: number;
  error?: string;
}

export interface FinalSummary {
  original_request: string;
  consolidated_output: string;
  task_contributions: {
    taskId: string;
    contribution_summary: string;
  }[];
  metadata: {
    total_tasks: number;
    completed_tasks: number;
    total_time: number;
    created_at: string;
  };
}
