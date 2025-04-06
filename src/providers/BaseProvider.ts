export interface ProviderConfig {
  [key: string]: string | number | boolean;
}

export interface CompletionRequest {
  prompt: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}

export interface CompletionResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  context?: string;
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}

export interface ChatResponse {
  message: ChatMessage;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface Model {
  id: string;
  name: string;
  description?: string;
  contextSize?: number;
  capabilities?: string[];
}

export interface Provider {
  id: string;
  name: string;
  description: string;
  configFields: {
    name: string;
    key: string;
    type: "string" | "boolean" | "number";
    required: boolean;
    secret?: boolean;
    description?: string;
  }[];

  /**
   * Initialize the provider with configuration
   */
  initialize(config: ProviderConfig): Promise<void>;

  /**
   * Test the provider connection
   */
  testConnection(): Promise<boolean>;

  /**
   * Get available models for this provider
   */
  getAvailableModels(): Promise<Model[]>;

  /**
   * Generate a completion for the given prompt
   */
  complete(request: CompletionRequest): Promise<CompletionResponse>;

  /**
   * Generate a chat response for the given messages
   */
  chat(request: ChatRequest): Promise<ChatResponse>;

  /**
   * Clean up any resources
   */
  dispose(): Promise<void>;
}

export abstract class BaseProvider implements Provider {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract configFields: {
    name: string;
    key: string;
    type: "string" | "boolean" | "number";
    required: boolean;
    secret?: boolean;
    description?: string;
  }[];

  protected config: ProviderConfig = {};

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
  }

  abstract testConnection(): Promise<boolean>;
  abstract getAvailableModels(): Promise<Model[]>;
  abstract complete(request: CompletionRequest): Promise<CompletionResponse>;
  abstract chat(request: ChatRequest): Promise<ChatResponse>;

  async dispose(): Promise<void> {
    // Clean up any resources
  }
}
