/**
 * Groq API Client
 * High-speed, low-cost inference for orchestrator and discriminator
 * Uses Llama 3.1 8B for structured output tasks
 */

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqResponse {
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

export class GroqClient {
  private apiKey: string;
  private baseURL: string = 'https://api.groq.com/openai/v1';
  private model: string;

  constructor(apiKey: string, model: string = 'llama-3.1-8b-instant') {
    if (!apiKey) {
      throw new Error('Groq API key is required');
    }
    this.apiKey = apiKey;
    this.model = model;  // Allow model selection (8B for orchestrator, 70B for generation)
  }

  /**
   * Generate a completion using Groq
   */
  async createChatCompletion(
    messages: GroqMessage[],
    options: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      response_format?: { type: 'json_object' };
    } = {}
  ): Promise<GroqResponse> {
    const requestBody: any = {
      model: this.model,
      messages,
      temperature: options.temperature ?? 0.1, // Low temperature for structured output
      max_tokens: options.max_tokens ?? 500,
      top_p: options.top_p ?? 0.95,
    };

    // Add response_format if provided
    if (options.response_format) {
      requestBody.response_format = options.response_format;
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get the model being used
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Get token usage statistics from a response
   */
  getTokenUsage(response: GroqResponse): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } {
    return {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
    };
  }

  /**
   * Generate a response (compatible with XAIClient interface)
   * Used for final response generation when saving credits
   */
  async generateResponse(
    systemPrompt: string,
    userQuery: string,
    context: string,
    options?: {
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<string> {
    const messages: GroqMessage[] = [
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

