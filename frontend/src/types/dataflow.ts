export type DataSourceType = 'csv' | 'json' | 'text' | 'excel' | 'database';

export type DataTaskType = 
  | 'data-cleaning'
  | 'data-exploration'
  | 'statistical-analysis'
  | 'visualization'
  | 'hypothesis-testing'
  | 'correlation-analysis'
  | 'pattern-recognition'
  | 'conclusion-generation';

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  content: string;
  columns?: string[];
  rowCount?: number;
  sampleData?: Record<string, any>[];
  uploadedAt: string;
  size?: number;
}

export interface DataTask {
  id: string;
  type: DataTaskType;
  title: string;
  description: string;
  required_skills: string[];
  dependencies: string[];
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  assigned_agent?: string;
  output?: DataTaskOutput;
  error?: string;
  execution_time?: number;
}

export interface DataTaskOutput {
  type: 'text' | 'code' | 'table' | 'chart' | 'json';
  content: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface DataFlowExecutionResult {
  taskId: string;
  agentId: string;
  output: DataTaskOutput;
  status: 'success' | 'error';
  execution_time: number;
  error?: string;
}

export interface ModelComparison {
  modelId: string;
  output: DataTaskOutput;
  confidence: number;
  reasoning: string;
}

export interface CrossValidationResult {
  consensus: boolean;
  conflicting_points: string[];
  consolidated_findings: string;
  model_contributions: ModelComparison[];
}

export interface FinalAnalysisReport {
  original_request: string;
  executive_summary: string;
  detailed_findings: string[];
  recommendations: string[];
  charts: ChartSpecification[];
  cross_validation: CrossValidationResult;
  metadata: {
    total_tasks: number;
    completed_tasks: number;
    total_time: number;
    models_used: string[];
    created_at: string;
  };
}

export interface ChartSpecification {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'waterfall';
  title: string;
  data: Record<string, any>;
  options?: Record<string, any>;
}