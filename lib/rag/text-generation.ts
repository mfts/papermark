import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { openai } from '../openai';
import { promptManager, PROMPT_IDS } from './prompts';
import { configurationManager } from './config/configuration-manager';
import { ChatMetadataTracker } from './services/chat-metadata-tracker.service';
import { RAGError } from './errors/rag-errors';
import { redis } from '../redis';
import { chatStorageService } from './services/chat-storage.service';
import { getRAGTools } from './tools/rag-tools';


export class TextGenerationService {
    private readonly defaultModel: string;

    constructor(private config: ReturnType<typeof configurationManager.getRAGConfig>) {
        this.defaultModel = this.config.llm.model;
    }


    private getResearchTools(dataroomId?: string, documentIds?: string[]): any {
        if (!dataroomId || !documentIds?.length) {
            return undefined;
        }
        return getRAGTools({ dataroomId, documentIds });
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

                if (process.env.NODE_ENV === 'development') {
                    console.log('🔄 Fallback Response:', {
                        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
                        chatSessionId
                    });
                }

                const prompt = await promptManager.renderTemplate(PROMPT_IDS.RAG_FALLBACK_RESPONSE, { query });

                const stream = streamText({
                    model: this.getModel(),
                    system: prompt,
                    messages: [{ role: 'user', content: `Question: ${query}` }],
                    onFinish: async ({ text, usage, finishReason }) => {
                        if (process.env.NODE_ENV === 'development') {
                            console.log('🔄 Fallback Response Generated:', {
                                responseLength: text?.length || 0,
                                finishReason,
                                tokens: usage ? {
                                    input: usage.inputTokens || 0,
                                    output: usage.outputTokens || 0,
                                    total: usage.totalTokens || 0
                                } : null,
                                chatSessionId
                            });
                        }

                        if (usage && metadataTracker) {
                            metadataTracker.setTokenUsage({
                                inputTokens: usage.inputTokens || 0,
                                outputTokens: usage.outputTokens || 0,
                                totalTokens: usage.totalTokens || 0
                            });
                        }

                        if (text && chatSessionId && metadataTracker) {
                            try {
                                await chatStorageService.addMessage({
                                    sessionId: chatSessionId,
                                    role: 'assistant',
                                    content: text,
                                    metadata: metadataTracker.getMetadata()
                                });
                            } catch (error) {
                                console.error('❌ Failed to store fallback message:', error);
                            }
                        }
                    }
                });

                return stream.toUIMessageStreamResponse();
            },
            'textGeneration',
            { service: 'TextGeneration', operation: 'generateFallbackResponse', query }
        );
    }


    private getModel() {
        const modelName = this.config.llm.model || this.defaultModel;
        return openai(modelName);
    }

    async generateRAGResponseWithTools(
        context: string,
        messages: UIMessage[],
        query: string,
        enableTools: boolean = false,
        abortSignal?: AbortSignal,
        chatSessionId?: string,
        metadataTracker?: ChatMetadataTracker,
        pageNumbers?: number[],
        dataroomId?: string,
        documentIds?: string[]
    ): Promise<Response> {
        return RAGError.withErrorHandling(
            async () => {

                if (process.env.NODE_ENV === 'development') {
                    console.log('🤖 LLM Request:', {
                        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
                        contextLength: context.length,
                        messagesCount: messages.length,
                        enableTools,
                        chatSessionId,
                        pageNumbers
                    });
                }

                this.validateInputs(context, messages, query);

                const systemContent = await this.buildRAGSystemPrompt(context, pageNumbers, query);
                const tools = enableTools ? this.getResearchTools(dataroomId, documentIds) : undefined;

                if (process.env.NODE_ENV === 'development') {
                    console.log('📝 System Prompt Details:', {
                        promptLength: systemContent.length,
                        promptPreview: systemContent.substring(0, 300) + (systemContent.length > 300 ? '...' : ''),
                        hasContext: context.length > 0,
                        contextSnippet: context.substring(0, 150) + (context.length > 150 ? '...' : '')
                    });
                }

                const stream = streamText({
                    model: this.getModel(),
                    system: systemContent,
                    messages: [...convertToModelMessages(messages), { role: 'user', content: query }],
                    tools,
                    temperature: this.config.generation.temperature,
                    abortSignal,
                    onFinish: async ({ text, usage, finishReason }) => {
                        if (process.env.NODE_ENV === 'development') {
                            console.log('🤖 LLM Response:', {
                                responseLength: text?.length || 0,
                                finishReason,
                                tokens: usage ? {
                                    input: usage.inputTokens || 0,
                                    output: usage.outputTokens || 0,
                                    total: usage.totalTokens || 0
                                } : null,
                                chatSessionId
                            });
                        }

                        if (usage && metadataTracker) {
                            metadataTracker.setTokenUsage({
                                inputTokens: usage.inputTokens || 0,
                                outputTokens: usage.outputTokens || 0,
                                totalTokens: usage.totalTokens || 0
                            });
                        }

                        if (text && chatSessionId && metadataTracker) {
                            try {
                                await chatStorageService.addMessage({
                                    sessionId: chatSessionId,
                                    role: 'assistant',
                                    content: text,
                                    metadata: metadataTracker.getMetadata()
                                });
                            } catch (error) {
                                console.error('❌ Failed to store assistant message:', error);
                            }
                        }
                    }
                });
                return stream.toUIMessageStreamResponse();
            },
            'textGeneration',
            { service: 'TextGeneration', operation: 'generateRAGResponseWithTools', query }
        );
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


    private async buildRAGSystemPrompt(context: string, pageNumbers?: number[], query?: string): Promise<string> {
        let pageInstructions = '';
        if (pageNumbers?.length) {
            const pageList =
                pageNumbers.length === 1 ? `page ${pageNumbers[0]}` : `pages ${pageNumbers.join(', ')}`;
            pageInstructions = `\n\nPAGE-SPECIFIC REQUEST: The user asked about ${pageList}. The provided context below IS the actual content from ${pageList}. Answer the user's question based on this content.`;
        }

        return promptManager.renderTemplate(PROMPT_IDS.RAG_RESPONSE_SYSTEM, {
            context: context + pageInstructions,
            query: query || 'User query'
        });
    }

}

export const textGenerationService = new TextGenerationService(configurationManager.getRAGConfig());