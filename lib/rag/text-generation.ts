import { openai } from '@ai-sdk/openai';
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { promptManager, PROMPT_IDS } from './prompts';
import { configurationManager } from './config';
import { chatStorageService } from './services/chat-storage.service';
import { ChatMetadataTracker } from './services/chat-metadata-tracker.service';
import { RAGError } from './errors';

interface StreamOptions {
    model: string;
    system: string;
    messages: any[];
    temperature?: number;
    maxTokens?: number;
    abortSignal?: AbortSignal;
    chatSessionId?: string;
    metadataTracker?: ChatMetadataTracker;
}

interface TokenUsage {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
}

export class TextGenerationService {
    private readonly defaultModel = 'gpt-4o-mini';

    constructor(private config: ReturnType<typeof configurationManager.getRAGConfig>) { }

    /**
     * Generate RAG response with context and citations
     */
    async generateRAGResponse(
        context: string,
        messages: UIMessage[],
        query: string,
        abortSignal?: AbortSignal,
        chatSessionId?: string,
        metadataTracker?: ChatMetadataTracker,
        pageNumbers?: number[]
    ): Promise<Response> {
        return RAGError.withErrorHandling(
            async () => {
                this.validateInputs(context, messages, query);

                const systemContent = await this.buildRAGSystemPrompt(context, pageNumbers);

                const stream = streamText(
                    this.createStreamOptions({
                        model: this.getModel(),
                        system: systemContent,
                        messages: [...convertToModelMessages(messages), { role: 'user', content: query }],
                        temperature: this.config.generation.temperature,
                        maxTokens: this.config.generation.maxTokens,
                        abortSignal,
                        chatSessionId,
                        metadataTracker,
                    })
                );

                return stream.toUIMessageStreamResponse();
            },
            'textGeneration',
            { service: 'TextGeneration', operation: 'generateRAGResponse', query }
        );
    }

    async generateFallbackResponse(
        query: string,
        chatSessionId?: string,
        metadataTracker?: ChatMetadataTracker
    ): Promise<Response> {
        return RAGError.withErrorHandling(
            async () => {
                if (!query?.trim()) {
                    throw RAGError.create('validation', 'Query is required for fallback response', { field: 'query' });
                }

                const prompt = await promptManager.renderTemplate(PROMPT_IDS.RAG_FALLBACK_RESPONSE, { query });

                const stream = streamText(
                    this.createStreamOptions({
                        model: this.getModel(),
                        system: prompt,
                        messages: [{ role: 'user', content: `Question: ${query}` }],
                        chatSessionId,
                        metadataTracker,
                    })
                );

                return stream.toUIMessageStreamResponse();
            },
            'textGeneration',
            { service: 'TextGeneration', operation: 'generateFallbackResponse', query }
        );
    }


    private getModel(): string {
        return this.config.llm.model || this.defaultModel;
    }

    private validateInputs(context: string, messages: UIMessage[], query: string): void {
        if (!query?.trim()) {
            throw RAGError.create('validation', 'Query is required', { field: 'query' });
        }
        if (!messages?.length) {
            throw RAGError.create('validation', 'Messages are required', { field: 'messages' });
        }
        if (!context?.trim()) {
            throw RAGError.create('validation', 'Context is required', { field: 'context' });
        }
    }

    private createStreamOptions({
        model,
        system,
        messages,
        temperature,
        maxTokens,
        abortSignal,
        chatSessionId,
        metadataTracker,
    }: StreamOptions) {
        return {
            model: openai(model),
            system,
            messages,
            temperature,
            maxTokens,
            abortSignal,
            onError: (error: unknown) => {
                console.error('[TextGenerationService] ❌ Stream error:', error);
            },
            onAbort: ({ steps }: { steps: any[] }) => {
                console.log(`[TextGenerationService] 🛑 Stream aborted after ${steps.length} steps`);
            },
            onFinish: async ({ text, totalUsage }: { text: string; totalUsage: TokenUsage }) => {
                if (chatSessionId && metadataTracker) {
                    await this.storeAssistantMessageWithContext(text, totalUsage, chatSessionId, metadataTracker);
                }
            },
        };
    }

    private async buildRAGSystemPrompt(context: string, pageNumbers?: number[]): Promise<string> {
        let pageInstructions = '';
        if (pageNumbers?.length) {
            const pageList =
                pageNumbers.length === 1 ? `page ${pageNumbers[0]}` : `pages ${pageNumbers.join(', ')}`;
            pageInstructions = `\n\nPAGE-SPECIFIC REQUEST: The user asked about ${pageList}. Use the provided context accordingly.`;
        }

        return promptManager.renderTemplate(PROMPT_IDS.RAG_RESPONSE_SYSTEM, {
            context: context + pageInstructions,
        });
    }

    private async storeAssistantMessageWithContext(
        text: string,
        totalUsage: TokenUsage,
        chatSessionId: string,
        metadataTracker: ChatMetadataTracker
    ) {
        try {
            if (totalUsage) {
                metadataTracker.setTokenUsage({
                    inputTokens: totalUsage?.promptTokens,
                    outputTokens: totalUsage?.completionTokens,
                    totalTokens: totalUsage?.totalTokens,
                });
            }

            await chatStorageService.addMessage({
                sessionId: chatSessionId,
                role: 'assistant',
                content: text,
                metadata: metadataTracker.getMetadata(),
            });
        } catch (error) {
        }
    }
}

export const textGenerationService = new TextGenerationService(configurationManager.getRAGConfig());