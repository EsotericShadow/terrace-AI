// src/lib/xai-client.ts
// xAI Grok API client for chat completions

export interface XAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface XAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class XAIClient {
  private apiKey: string;
  private baseURL: string = 'https://api.x.ai/v1';
  private model: string;

  constructor(apiKey: string, model: string = 'grok-2-latest') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async createChatCompletion(
    messages: XAIMessage[],
    options: {
      temperature?: number;
      max_tokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<XAIResponse> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 1000,
        stream: options.stream ?? false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`xAI API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async generateResponse(
    systemPrompt: string,
    userQuery: string,
    context: string,
    options?: {
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<string> {
    const messages: XAIMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nUser Question: ${userQuery}`,
      },
    ];

    const response = await this.createChatCompletion(messages, options);
    return response.choices[0]?.message?.content || 'No response generated';
  }
}

export const xaiClient = new XAIClient(process.env.XAI_API_KEY || '');

