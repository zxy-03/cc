export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  maxTokens?: number;
  temperature?: number;
}

export interface ChatResponse {
  content: string;
  finishReason: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  endpoint?: string;
  adapter: string;
  apiKeyEnv?: string;
  baseUrlEnv?: string;
}

export interface RoundtableResult {
  modelId: string;
  content: string;
  status: 'success' | 'error';
  error?: string;
}

export interface StreamDelta {
  modelId: string;
  delta: string;
}

export interface StreamDone {
  modelId: string;
  finishReason: string;
}

export interface IAIModelAdapter {
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;
  chatStream(messages: Message[], options?: ChatOptions): AsyncIterable<string>;
}
