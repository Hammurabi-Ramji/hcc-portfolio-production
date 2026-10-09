/**
 * Advanced AI Chat System with Streaming Support
 * Supports multiple models (Ollama, Claude, GPT-4)
 * Real-time token-by-token rendering
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  tokens?: number;
  metadata?: Record<string, unknown>;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  systemPrompt: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  archived?: boolean;
}

export interface StreamingResponse {
  conversationId: string;
  messageId: string;
  chunk: string;
  tokenCount: number;
  isComplete: boolean;
}

export interface AIModelConfig {
  name: string;
  provider: 'ollama' | 'openai' | 'anthropic';
  endpoint: string;
  apiKey?: string;
  maxTokens: number;
  temperature: number;
  topP: number;
}

/**
 * ChatStreamManager handles real-time streaming responses
 */
export class ChatStreamManager {
  private conversations: Map<string, ChatConversation> = new Map();
  private currentStream: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private modelConfigs: Map<string, AIModelConfig> = new Map();

  constructor() {
    this.initializeDefaultModels();
  }

  private initializeDefaultModels(): void {
    // Ollama local model
    this.modelConfigs.set('ollama-mistral', {
      name: 'Mistral (Ollama)',
      provider: 'ollama',
      endpoint: 'http://localhost:11434/api/generate',
      maxTokens: 2048,
      temperature: 0.7,
      topP: 0.9,
    });

    // OpenAI GPT-4
    this.modelConfigs.set('gpt-4', {
      name: 'GPT-4',
      provider: 'openai',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      maxTokens: 8192,
      temperature: 0.7,
      topP: 1.0,
    });

    // Anthropic Claude
    this.modelConfigs.set('claude-3', {
      name: 'Claude 3',
      provider: 'anthropic',
      endpoint: 'https://api.anthropic.com/v1/messages',
      maxTokens: 4096,
      temperature: 0.7,
      topP: 1.0,
    });
  }

  /**
   * Create a new conversation
   */
  public createConversation(
    title: string,
    model: string,
    systemPrompt: string = ''
  ): ChatConversation {
    const conversation: ChatConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      messages: [],
      model,
      systemPrompt: systemPrompt || this.getDefaultSystemPrompt(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
      archived: false,
    };

    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  /**
   * Stream a response from AI model
   */
  public async *streamResponse(
    conversationId: string,
    userMessage: string,
    onChunk?: (chunk: StreamingResponse) => void
  ): AsyncGenerator<StreamingResponse> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Add user message
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    conversation.messages.push(userMsg);

    // Create assistant message placeholder
    const assistantMsg: ChatMessage = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model: conversation.model,
      tokens: 0,
    };
    conversation.messages.push(assistantMsg);

    const modelConfig = this.modelConfigs.get(conversation.model);
    if (!modelConfig) {
      throw new Error(`Model ${conversation.model} not configured`);
    }

    try {
      const response = await fetch(modelConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(modelConfig.apiKey && {
            Authorization: `Bearer ${modelConfig.apiKey}`,
          }),
        },
        body: JSON.stringify({
          model: conversation.model,
          messages: this.formatMessagesForAPI(conversation.messages, modelConfig),
          stream: true,
          temperature: modelConfig.temperature,
          top_p: modelConfig.topP,
          max_tokens: modelConfig.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      this.currentStream = reader;
      let buffer = '';
      let tokenCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += new TextDecoder().decode(value);
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const chunk = this.extractChunkContent(data, modelConfig.provider);

              if (chunk) {
                assistantMsg.content += chunk;
                tokenCount++;
                assistantMsg.tokens = tokenCount;

                const streamResponse: StreamingResponse = {
                  conversationId,
                  messageId: assistantMsg.id,
                  chunk,
                  tokenCount,
                  isComplete: false,
                };

                onChunk?.(streamResponse);
                yield streamResponse;
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }

      // Final response
      assistantMsg.tokens = tokenCount;
      conversation.updatedAt = Date.now();

      yield {
        conversationId,
        messageId: assistantMsg.id,
        chunk: '',
        tokenCount,
        isComplete: true,
      };
    } catch (error) {
      // Clean up on error
      conversation.messages.pop();
      throw error;
    }
  }

  /**
   * Format messages for API call
   */
  private formatMessagesForAPI(
    messages: ChatMessage[],
    config: AIModelConfig
  ): Record<string, unknown>[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Extract content chunk from API response
   */
  private extractChunkContent(data: unknown, provider: string): string {
    const obj = data as Record<string, unknown>;

    switch (provider) {
      case 'ollama':
        return (obj.response as string) || '';
      case 'openai': {
        const openAIResponse = obj as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        return openAIResponse.choices?.[0]?.delta?.content || '';
      }
      case 'anthropic': {
        const anthropicResponse = obj as { delta?: { text?: string } };
        return anthropicResponse.delta?.text || '';
      }
      default:
        return '';
    }
  }

  /**
   * Get default system prompt
   */
  private getDefaultSystemPrompt(): string {
    return `You are a helpful AI assistant integrated into SUE, a sovereign browser extension. 
You have access to the user's notes, projects, and browsing context. 
Provide concise, accurate, and helpful responses. 
When referencing notes or projects, be specific and helpful.`;
  }

  /**
   * Search conversations
   */
  public searchConversations(query: string): ChatConversation[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.conversations.values()).filter(
      (conv) =>
        conv.title.toLowerCase().includes(lowerQuery) ||
        conv.messages.some((msg) => msg.content.toLowerCase().includes(lowerQuery)) ||
        conv.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Export conversation
   */
  public exportConversation(
    conversationId: string,
    format: 'json' | 'markdown' | 'pdf' = 'markdown'
  ): string {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    switch (format) {
      case 'json':
        return JSON.stringify(conversation, null, 2);
      case 'markdown':
        return this.exportAsMarkdown(conversation);
      case 'pdf':
        return this.exportAsPDF(conversation);
      default:
        return '';
    }
  }

  private exportAsMarkdown(conversation: ChatConversation): string {
    let md = `# ${conversation.title}\n\n`;
    md += `**Model:** ${conversation.model}\n`;
    md += `**Created:** ${new Date(conversation.createdAt).toLocaleString()}\n\n`;

    for (const msg of conversation.messages) {
      if (msg.role === 'user') {
        md += `## User\n${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        md += `## Assistant\n${msg.content}\n\n`;
      }
    }

    return md;
  }

  private exportAsPDF(conversation: ChatConversation): string {
    // Placeholder for PDF export
    return `PDF export for ${conversation.title}`;
  }

  /**
   * Get conversation history
   */
  public getConversation(conversationId: string): ChatConversation | undefined {
    return this.conversations.get(conversationId);
  }

  /**
   * List all conversations
   */
  public listConversations(): ChatConversation[] {
    return Array.from(this.conversations.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * Delete conversation
   */
  public deleteConversation(conversationId: string): boolean {
    return this.conversations.delete(conversationId);
  }

  /**
   * Archive conversation
   */
  public archiveConversation(conversationId: string): boolean {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.archived = true;
      conversation.updatedAt = Date.now();
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const chatStreamManager = new ChatStreamManager();
