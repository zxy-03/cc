export type ModelRole = 'analyst' | 'creative' | 'summarizer' | 'fact-checker' | 'writer' | 'general';

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  role?: ModelRole;
  expertise?: string[];
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  modelId: string;
  content: string;
  finishReason: string;
}

export interface RoundtableResult {
  modelId: string;
  content: string;
  status: 'success' | 'error';
  error?: string;
}
