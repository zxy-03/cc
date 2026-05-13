import Anthropic from '@anthropic-ai/sdk';
import { Message, ChatOptions, ChatResponse, IAIModelAdapter } from '../types';

export class ClaudeAdapter implements IAIModelAdapter {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 0.7,
      messages: messages.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
    });

    return {
      content: response.content[0].type === 'text' ? response.content[0].text : '',
      finishReason: response.stop_reason || 'stop',
    };
  }

  async *chatStream(messages: Message[], options?: ChatOptions): AsyncIterable<string> {
    const stream = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 0.7,
      messages: messages.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }
}
