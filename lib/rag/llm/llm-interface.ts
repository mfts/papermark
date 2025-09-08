import { z } from 'zod';
import {
    LLMResponse,
    LLMOptions,
    TokenUsage,
    RAG_CONSTANTS
} from '../types/rag-types';

import { RAGError } from '../errors';


export interface LLMProvider {
    generateObject<T>(
        schema: z.ZodSchema<T>,
        prompt: string,
        options?: LLMOptions
    ): Promise<LLMResponse<T>>;

    streamText(
        prompt: string,
        options?: LLMOptions
    ): Promise<AsyncIterable<string>>;

    generateText(
        prompt: string,
        options?: LLMOptions
    ): Promise<LLMResponse<string>>;


    getProviderInfo(): ProviderInfo;


    isAvailable(): Promise<boolean>;
}

export interface ProviderInfo {
    name: string;
    version: string;
    supportedModels: string[];
    maxTokens: number;
    supportsStreaming: boolean;
}


export abstract class BaseLLMService {
    protected provider: LLMProvider;
    protected defaultOptions: LLMOptions;

    constructor(provider: LLMProvider, defaultOptions: LLMOptions = {}) {
        this.provider = provider;
        this.defaultOptions = {
            temperature: RAG_CONSTANTS.MEDIUM_CONFIDENCE,
            timeout: RAG_CONSTANTS.DEFAULT_TIMEOUT,
            retries: RAG_CONSTANTS.DEFAULT_RETRY_ATTEMPTS,
            ...defaultOptions
        };
    }

    async generateObject<T>(
        schema: z.ZodSchema<T>,
        prompt: string,
        options?: LLMOptions
    ): Promise<LLMResponse<T>> {
        const mergedOptions = this.mergeOptions(options);

        try {
            return await this.provider.generateObject(schema, prompt, mergedOptions);
        } catch (error) {
            throw RAGError.create('llmCall', undefined, { operation: 'LLM generation' }, error instanceof Error ? error : new Error(String(error)));
        }
    }


    async generateText(
        prompt: string,
        options?: LLMOptions
    ): Promise<LLMResponse<string>> {
        const mergedOptions = this.mergeOptions(options);

        try {
            return await this.provider.generateText(prompt, mergedOptions);
        } catch (error) {
            throw RAGError.create('llmCall', undefined, { operation: 'LLM text generation' }, error instanceof Error ? error : new Error(String(error)));
        }
    }


    async streamText(
        prompt: string,
        options?: LLMOptions
    ): Promise<AsyncIterable<string>> {
        const mergedOptions = this.mergeOptions(options);

        try {
            return await this.provider.streamText(prompt, mergedOptions);
        } catch (error) {
            throw RAGError.create('llmCall', undefined, { operation: 'LLM streaming' }, error instanceof Error ? error : new Error(String(error)));
        }
    }


    getProviderInfo(): ProviderInfo {
        return this.provider.getProviderInfo();
    }


    async isAvailable(): Promise<boolean> {
        return await this.provider.isAvailable();
    }


    protected mergeOptions(options?: LLMOptions): LLMOptions {
        return {
            ...this.defaultOptions,
            ...options
        };
    }

    protected validateOptions(options: LLMOptions): void {
        if (options.temperature !== undefined && (options.temperature < 0 || options.temperature > 2)) {
            throw RAGError.create('validation', 'Temperature must be between 0 and 2', { field: 'temperature' });
        }
        if (options.maxTokens !== undefined && options.maxTokens <= 0) {
            throw RAGError.create('validation', 'Max tokens must be positive', { field: 'maxTokens' });
        }
        if (options.timeout !== undefined && options.timeout <= 0) {
            throw RAGError.create('validation', 'Timeout must be positive', { field: 'timeout' });
        }
    }
}

export class OpenAIProvider implements LLMProvider {
    private model: string;

    constructor(model: string = 'gpt-4o-mini') {
        this.model = model;
    }

    async generateObject<T>(
        schema: z.ZodSchema<T>,
        prompt: string,
        options?: LLMOptions
    ): Promise<LLMResponse<T>> {
        const { generateObject } = await import('ai');
        const { openai } = await import('@ai-sdk/openai');

        const model = openai(this.model);
        const startTime = Date.now();

        try {
            const result = await generateObject({
                model,
                schema,
                prompt,
                temperature: options?.temperature,
                abortSignal: options?.signal
            });

            const processingTime = Date.now() - startTime;

            return {
                content: result.object as T,
                usage: {
                    promptTokens: 0,
                    completionTokens: 0,
                    totalTokens: 0
                },
                model: this.model,
                processingTime
            };
        } catch (error) {
            console.error('❌ LLM generateObject failed:', error);

            if (error && typeof error === 'object' && 'cause' in error) {
                const cause = (error as any).cause;
                if (cause && typeof cause === 'object' && 'issues' in cause) {
                    console.error('🔍 Schema validation issues:', cause.issues);
                }
            }

            throw RAGError.create('llmCall', undefined, { operation: 'OpenAI generation' }, error instanceof Error ? error : new Error(String(error)));
        }
    }

    async streamText(
        prompt: string,
        options?: LLMOptions
    ): Promise<AsyncIterable<string>> {
        const { streamText } = await import('ai');
        const { openai } = await import('@ai-sdk/openai');

        const model = openai(this.model);

        try {
            const result = await streamText({
                model,
                prompt,
                temperature: options?.temperature,
                abortSignal: options?.signal
            });

            return result.textStream;
        } catch (error) {
            throw RAGError.create('llmCall', undefined, { operation: 'OpenAI streaming' }, error instanceof Error ? error : new Error(String(error)));
        }
    }

    async generateText(
        prompt: string,
        options?: LLMOptions
    ): Promise<LLMResponse<string>> {
        const { generateText } = await import('ai');
        const { openai } = await import('@ai-sdk/openai');

        const model = openai(this.model);
        const startTime = Date.now();

        try {
            const result = await generateText({
                model,
                prompt,
                temperature: options?.temperature,
                abortSignal: options?.signal
            });

            const processingTime = Date.now() - startTime;

            return {
                content: result.text,
                usage: {
                    promptTokens: 0,
                    completionTokens: 0,
                    totalTokens: 0
                },
                model: this.model,
                processingTime
            };
        } catch (error) {
            throw RAGError.create('llmCall', undefined, { operation: 'OpenAI text generation' }, error instanceof Error ? error : new Error(String(error)));
        }
    }

    getProviderInfo(): ProviderInfo {
        return {
            name: 'OpenAI',
            version: '1.0.0',
            supportedModels: ['gpt-4o-mini', 'gpt-5-nano', 'gpt-5-mini'],
            maxTokens: 128000,
            supportsStreaming: true
        };
    }

    async isAvailable(): Promise<boolean> {
        try {
            // Simple availability check
            return process.env.OPENAI_API_KEY !== undefined;
        } catch {
            return false;
        }
    }
}

export class LLMServiceFactory {
    private static providers = new Map<string, LLMProvider>();

    /**
     * Register a provider
     */
    static registerProvider(name: string, provider: LLMProvider): void {
        this.providers.set(name, provider);
    }

    /**
     * Get a provider by name
     */
    static getProvider(name: string): LLMProvider {
        const provider = this.providers.get(name);
        if (!provider) {
            throw RAGError.create('validation', `LLM provider '${name}' not found`, { field: 'provider' });
        }
        return provider;
    }

    /**
     * Create LLM service with provider
     */
    static createService(providerName: string, options?: LLMOptions): BaseLLMService {
        const provider = this.getProvider(providerName);
        return new LLMService(provider, options);
    }

    /**
     * Get available providers
     */
    static getAvailableProviders(): string[] {
        return Array.from(this.providers.keys());
    }
}

export class LLMService extends BaseLLMService {
    constructor(provider: LLMProvider, options?: LLMOptions) {
        super(provider, options);
    }
}

LLMServiceFactory.registerProvider('openai', new OpenAIProvider());

export function getDefaultLLMService() {
    return LLMServiceFactory.createService('openai');
}
