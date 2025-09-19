import { z } from 'zod';
import {
    LLMResponse,
    LLMOptions,
    RAG_CONSTANTS
} from './types/rag-types';

import { RAGError } from './errors/rag-errors';

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


    protected mergeOptions(options?: LLMOptions): LLMOptions {
        return {
            ...this.defaultOptions,
            ...options
        };
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
                    promptTokens: (result.usage as any)?.promptTokens || 0,
                    completionTokens: (result.usage as any)?.completionTokens || 0,
                    totalTokens: (result.usage as any)?.totalTokens || 0
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

}

export class LLMServiceFactory {
    private static providers = new Map<string, LLMProvider>();

    static registerProvider(name: string, provider: LLMProvider): void {
        this.providers.set(name, provider);
    }

    static createService(providerName: string, options?: LLMOptions): BaseLLMService {
        const provider = this.providers.get(providerName);
        if (!provider) {
            throw RAGError.create('validation', `LLM provider '${providerName}' not found`, { field: 'provider' });
        }
        return new ConcreteLLMService(provider, options);
    }
}

class ConcreteLLMService extends BaseLLMService {
    constructor(provider: LLMProvider, options?: LLMOptions) {
        super(provider, options);
    }
}

LLMServiceFactory.registerProvider('openai', new OpenAIProvider());

export function getDefaultLLMService() {
    return LLMServiceFactory.createService('openai');
}

export const llmProvider = getDefaultLLMService();

import { promptManager } from './prompts';

export async function generateLLMResponse<T>(
    promptId: string,
    variables: Record<string, any>,
    options?: LLMOptions
): Promise<T> {
    return RAGError.withErrorHandling(
        async () => {
            const prompt = await promptManager.renderTemplate(promptId, variables);
            const schema = await promptManager.getTemplateSchema(promptId);
            const optimization = await promptManager.getTemplateOptimization(promptId);

            if (!schema) {
                throw RAGError.create('templateNotFound', undefined, { templateId: promptId });
            }

            const result = await llmProvider.generateObject(
                schema,
                prompt,
                {
                    temperature: optimization?.temperature,
                    model: optimization?.model,
                    signal: options?.signal,
                    ...options
                }
            );

            return result.content as T;
        },
        'llmCall',
        { service: 'LLMUtils', operation: 'generateLLMResponse', promptId }
    );
}
