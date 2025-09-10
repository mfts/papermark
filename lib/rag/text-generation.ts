
import { openai } from '@ai-sdk/openai';
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { Source } from './types/rag-types';
import { promptManager, PROMPT_IDS } from './prompts';
import { configurationManager } from './config';
import { chatStorageService } from './services/chat-storage.service';
import { ChatMetadataTracker } from './services/chat-metadata-tracker.service';

export class TextGenerationService {
    constructor(private config: ReturnType<typeof configurationManager.getRAGConfig>) { }

    /**
     * Generate RAG response with context and citations
     */
    async generateRAGResponse(
        context: string,
        messages: UIMessage[],
        query: string,
        sources: Source[],
        abortSignal?: AbortSignal,
        chatSessionId?: string,
        metadataTracker?: ChatMetadataTracker,
        pageNumbers?: number[]
    ): Promise<Response> {
        try {
            const systemContent = await this.buildRAGSystemPrompt(context, sources, pageNumbers);

            const streamOptions: any = {
                model: openai('gpt-4o-mini'),
                messages: [
                    { role: 'system', content: systemContent },
                    ...convertToModelMessages(messages),
                    { role: 'user', content: query }
                ],
                temperature: this.config.generation.temperature,
                maxTokens: this.config.generation.maxTokens,
                abortSignal: abortSignal, // Pass abort signal to streaming
                onError: (error: any) => {
                    console.error('❌ Stream error in generateRAGResponse:', error);
                },
                onAbort: ({ steps }: { steps: any[] }) => {
                    console.log(`🛑 RAG response stream aborted after ${steps.length} steps`);
                },
                onFinish: async ({ text, totalUsage }: { text: string; totalUsage: any }) => {
                    if (chatSessionId && metadataTracker) {
                        try {
                            await this.storeAssistantMessageWithContext(text, totalUsage, chatSessionId, metadataTracker);
                        } catch (error) {
                            console.error('❌ Failed to store assistant message:', error);
                        }
                    }
                }
            };

            const stream = streamText(streamOptions);

            const response = stream.toUIMessageStreamResponse();
            return response;

        } catch (error) {
            console.error('❌ Error in generateRAGResponse:', error);
            throw error;
        }
    }


    async generateFallbackResponse(
        query: string,
        chatSessionId?: string,
        metadataTracker?: ChatMetadataTracker
    ) {
        // Use centralized prompt system
        const prompt = await promptManager.renderTemplate(PROMPT_IDS.RAG_FALLBACK_RESPONSE, {
            query
        });

        const optimization = await promptManager.getTemplateOptimization(PROMPT_IDS.RAG_FALLBACK_RESPONSE);

        const streamOptions: any = {
            model: openai('gpt-4o-mini'),
            system: prompt,
            messages: [{ role: 'user', content: `Question: ${query}` }],
            onError: (error: any) => {
                console.error('❌ Stream error in generateFallbackResponse:', error);
            },
            onAbort: ({ steps }: { steps: any[] }) => {
                console.log(`🛑 Fallback response stream aborted after ${steps.length} steps`);
            },
            onFinish: async ({ text, totalUsage }: { text: string; totalUsage: any }) => {
                // Store assistant message if session ID is provided
                if (chatSessionId && metadataTracker) {
                    try {
                        await this.storeAssistantMessageWithContext(text, totalUsage, chatSessionId, metadataTracker);
                    } catch (error) {
                        console.error('Failed to store fallback assistant message:', error);
                    }
                }
            }
        };

        const stream = streamText(streamOptions);
        return stream.toUIMessageStreamResponse();
    }


    async generateSimpleResponse(
        systemPrompt: string,
        messages: UIMessage[],
        signal?: AbortSignal,
        chatSessionId?: string,
        metadataTracker?: ChatMetadataTracker
    ): Promise<Response> {
        const streamOptions: any = {
            model: openai('gpt-4o-mini'),
            system: systemPrompt,
            messages: convertToModelMessages(messages),
            temperature: this.config.generation.temperature,
            onError: (error: any) => {
                console.error('❌ Stream error in generateSimpleResponse:', error);
            },
            onAbort: ({ steps }: { steps: any[] }) => {
                console.log(`🛑 Simple response stream aborted after ${steps.length} steps`);
            },
            onFinish: async ({ text, totalUsage }: { text: string; totalUsage: any }) => {
                // Store assistant message if session ID is provided
                if (chatSessionId && metadataTracker) {
                    try {
                        await this.storeAssistantMessageWithContext(text, totalUsage, chatSessionId, metadataTracker);
                    } catch (error) {
                        console.error('Failed to store simple assistant message:', error);
                    }
                }
            }
        };

        if (signal) {
            streamOptions.abortSignal = signal;
        }

        const stream = streamText(streamOptions);
        const response = stream.toUIMessageStreamResponse();
        return response;
    }


    private async buildRAGSystemPrompt(context: string, sources: Source[], pageNumbers?: number[]): Promise<string> {
        const citationLines = sources.map(s =>
            `• ${s.documentName}${s.pageNumber ? ` (p.${s.pageNumber})` : ''}${s.locationInfo ? ` - ${s.locationInfo}` : ''}`
        ).join('\n');
        let pageInstructions = '';
        if (pageNumbers && pageNumbers.length > 0) {
            const pageList = pageNumbers.length === 1 ? `page ${pageNumbers[0]}` : `pages ${pageNumbers.join(', ')}`;
            pageInstructions = `\n\nPAGE-SPECIFIC REQUEST: The user asked about ${pageList}. The context below contains information from the requested page(s). Use this information to answer their question. The sources list shows which page(s) the information comes from. Always mention which specific page(s) you used in your answer.`;
        }

        return await promptManager.renderTemplate(PROMPT_IDS.RAG_RESPONSE_SYSTEM, {
            context,
            sources: citationLines + pageInstructions
        });
    }




    private async storeAssistantMessageWithContext(
        text: string,
        totalUsage: any,
        chatSessionId: string,
        metadataTracker: ChatMetadataTracker
    ) {
        try {
            if (totalUsage) {
                metadataTracker.setTokenUsage({
                    inputTokens: totalUsage.promptTokens,
                    outputTokens: totalUsage.completionTokens,
                    totalTokens: totalUsage.totalTokens,
                });
            }

            await chatStorageService.addMessage({
                sessionId: chatSessionId,
                role: 'assistant',
                content: text,
                metadata: metadataTracker.getMetadata(),
            });

        } catch (error) {
            console.error('Failed to store assistant message:', error);
        }
    }
}

export const textGenerationService = new TextGenerationService(configurationManager.getRAGConfig());
