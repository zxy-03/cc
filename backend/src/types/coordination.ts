export type TaskType = 'analysis' | 'creative-writing' | 'fact-checking' | 'summarization' | 'detailed-explanation';

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