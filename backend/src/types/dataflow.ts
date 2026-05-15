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

export interface UploadedFileInfo {
  id: string;
  filename: string;
  type: DataSourceType;
  size: number;
  content: string;
  uploadedAt: string;
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

export interface DataAnalysisRequest {
  user_request: string;
  data_source?: string;
  parameters?: Record<string, any>;
}

export interface TaskBreakdownResult {
  success: boolean;
  tasks: DataTask[];
  original_request: string;
  dependency_graph: string[];
  error?: string;
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

export interface DataFlowPhase {
  phase: 'breakdown' | 'execution' | 'validation' | 'report';
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  progress: number;
  message?: string;
}

export interface DataFlowSession {
  id: string;
  user_request: string;
  phases: DataFlowPhase[];
  tasks: DataTask[];
  execution_results: DataFlowExecutionResult[];
  final_report?: FinalAnalysisReport;
  created_at: string;
  updated_at: string;
}

export interface TaskRecommendation {
  taskId: string;
  recommended_agents: string[];
  confidence: number;
  reasoning: string;
}

export interface AnalysisInsight {
  id: string;
  category: 'key_finding' | 'warning' | 'opportunity' | 'suggestion';
  title: string;
  description: string;
  source_model: string;
  confidence: number;
}