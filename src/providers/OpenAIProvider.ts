import OpenAI from 'openai';
import {
    BaseProvider,
    ChatMessage,
    ChatRequest,
    ChatResponse,
    CompletionRequest,
    CompletionResponse,
} from './BaseProvider';

export class OpenAIProvider extends BaseProvider {
    id = 'openai';
    name = 'OpenAI';
    description = 'Access GPT-3.5, GPT-4, and other OpenAI models';
    configFields = [
        {
            name: 'API Key',
            key: 'apiKey',
            type: 'string' as const,
            required: true,
            secret: true,
            description: 'Your OpenAI API key'
        },
        {
            name: 'Model',
            key: 'model',
            type: 'string' as const,
            required: true,
            description: 'The model to use (e.g., gpt-4, gpt-3.5-turbo)'
        },
        {
            name: 'Organization ID',
            key: 'organizationId',
            type: 'string' as const,
            required: false,
            description: 'Optional: Your OpenAI organization ID'
        }
    ];

    private client: OpenAI | null = null;

    async initialize(config: Record<string, string>): Promise<void> {
        await super.initialize(config);
        
        const clientConfig: any = {
            apiKey: config.apiKey,
        };

        if (config.organizationId) {
            clientConfig.organization = config.organizationId;
        }

        this.client = new OpenAI(clientConfig);
    }

    async testConnection(): Promise<boolean> {
        try {
            if (!this.client) {
                throw new Error('OpenAI client not initialized');
            }

            // Test the connection by listing models
            await this.client.models.list();
            return true;
        } catch (error) {
            console.error('OpenAI connection test failed:', error);
            return false;
        }
    }

    async complete(request: CompletionRequest): Promise<CompletionResponse> {
        if (!this.client) {
            throw new Error('OpenAI client not initialized');
        }

        try {
            const response = await this.client.completions.create({
                model: this.config.model as string,
                prompt: request.prompt,
                max_tokens: request.maxTokens,
                temperature: request.temperature,
                stop: request.stopSequences,
            });

            return {
                text: response.choices[0]?.text || '',
                usage: {
                    promptTokens: response.usage?.prompt_tokens || 0,
                    completionTokens: response.usage?.completion_tokens || 0,
                    totalTokens: response.usage?.total_tokens || 0,
                },
            };
        } catch (error) {
            console.error('OpenAI completion error:', error);
            throw error;
        }
    }

    async chat(request: ChatRequest): Promise<ChatResponse> {
        if (!this.client) {
            throw new Error('OpenAI client not initialized');
        }

        try {
            const messages = request.messages.map(msg => ({
                role: msg.role,
                content: msg.content,
            }));

            const response = await this.client.chat.completions.create({
                model: this.config.model as string,
                messages,
                max_tokens: request.maxTokens,
                temperature: request.temperature,
                stop: request.stopSequences,
            });

            const message = response.choices[0]?.message;
            if (!message) {
                throw new Error('No response from OpenAI');
            }

            return {
                message: {
                    role: message.role as ChatMessage['role'],
                    content: message.content || '',
                },
                usage: {
                    promptTokens: response.usage?.prompt_tokens || 0,
                    completionTokens: response.usage?.completion_tokens || 0,
                    totalTokens: response.usage?.total_tokens || 0,
                },
            };
        } catch (error) {
            console.error('OpenAI chat error:', error);
            throw error;
        }
    }

    async dispose(): Promise<void> {
        // Nothing to clean up for OpenAI
        this.client = null;
    }
}