import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { openai } from '../openai';
import { promptManager, PROMPT_IDS } from './prompts';
import { configurationManager } from './config/configuration-manager';
import { ChatMetadataTracker } from './services/chat-metadata-tracker.service';
import { RAGError } from './errors/rag-errors';
import { redis } from '../redis';
import { vectorSearchService } from './vector-search';
import { chatStorageService } from './services/chat-storage.service';


export class TextGenerationService {
    private readonly defaultModel: string;

    constructor(private config: ReturnType<typeof configurationManager.getRAGConfig>) {
        this.defaultModel = this.config.llm.model;
    }


    private async executeWithCache<T>(
        cacheKey: string,
        operation: () => Promise<T>,
        ttl: number = 30
    ): Promise<T> {
        try {
            const cached = await redis.get<string>(cacheKey);
            if (cached) {
                return JSON.parse(cached) as T;
            }
        } catch (cacheError) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('Redis cache read failed:', cacheError);
            }
        }

        const result = await operation();

        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
        } catch (cacheError) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('Redis cache write failed:', cacheError);
            }
        }

        return result;
    }

    private getResearchTools(dataroomId?: string, documentIds?: string[]): any {
        const CACHE_TTL = 30;

        return {
            search_academic_papers: {
                description: 'Search for academic papers and research documents within the provided document collection. Use this tool when you need to find specific information, concepts, or documents that might not be in the current context. This tool performs semantic search across all indexed documents to find relevant content.',
                parameters: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'The search query for academic papers within the document collection. Be specific and descriptive to get better results. Examples: "machine learning algorithms", "statistical analysis methods", "research methodology", "conclusion findings". Keep queries under 500 characters.'
                        }
                    },
                    required: ['query'],
                    additionalProperties: false
                },
                execute: async ({ query }: { query: string }) => {
                    const trimmedQuery = query?.trim();
                    if (!trimmedQuery || trimmedQuery.length === 0) {
                        return 'Error: Query parameter is required and must be a non-empty string.';
                    }

                    if (trimmedQuery.length > 500) {
                        return 'Error: Query is too long. Please keep your search query under 500 characters.';
                    }

                    if (!dataroomId || !documentIds?.length) {
                        return 'Unable to search: No document collection context available.';
                    }

                    const cacheKey = `rag:tool_cache:search:${trimmedQuery}:${dataroomId}:${documentIds.join(',')}`;

                    return await this.executeWithCache(cacheKey, async () => {
                        const timeoutMs = 8000;

                        try {
                            const searchPromise = vectorSearchService.searchSimilarChunks(
                                trimmedQuery,
                                dataroomId,
                                documentIds,
                                {
                                    topK: 5,
                                    similarityThreshold: 0.2,
                                    metadataFilter: { documentIds, dataroomId }
                                }
                            );

                            const timeoutPromise = new Promise<never>((_, reject) =>
                                setTimeout(() => reject(new Error('Search timeout')), timeoutMs)
                            );

                            const searchResults = await Promise.race([searchPromise, timeoutPromise]);

                            if (searchResults.length === 0) {
                                return `No documents found related to "${trimmedQuery}". Try different keywords.`;
                            }

                            const formattedResults = searchResults.map((result, index) => {
                                const docName = result.metadata.documentName || 'Unknown Document';
                                const pageInfo = result.metadata.pageRanges ? ` (Page ${result.metadata.pageRanges.join(', ')})` : '';
                                const relevance = (result.similarity * 100).toFixed(1);
                                const content = result.content.substring(0, 300);

                                return `${index + 1}. **${docName}**${pageInfo} - ${relevance}%\n   ${content}${result.content.length > 300 ? '...' : ''}`;
                            }).join('\n\n');

                            return `Found ${searchResults.length} relevant documents:\n\n${formattedResults}`;
                        } catch (error) {
                            if (error instanceof Error && error.message.includes('timeout')) {
                                return 'Search timeout: Please try a simpler query.';
                            }
                            throw error;
                        }
                    }, CACHE_TTL);
                }
            },
            get_document_summary: {
                description: 'Get a summary of a specific document by its ID. Use this tool when you need a high-level overview of a particular document or want to understand its main topics and structure.',
                parameters: {
                    type: 'object',
                    properties: {
                        documentId: {
                            type: 'string',
                            description: 'The ID of the document to summarize. Must be one of the available document IDs in the current context.'
                        },
                        summaryType: {
                            type: 'string',
                            enum: ['overview', 'detailed', 'key_points'],
                            description: 'Type of summary: "overview" for brief summary, "detailed" for comprehensive summary, "key_points" for main points only.'
                        }
                    },
                    required: ['documentId'],
                    additionalProperties: false
                },
                execute: async ({ documentId, summaryType = 'overview' }: { documentId: string; summaryType?: string }) => {
                    if (!documentId?.trim()) {
                        return 'Error: Document ID is required and must be a non-empty string.';
                    }

                    if (!documentIds?.includes(documentId)) {
                        return `Error: Document ID "${documentId}" is not available in the current context.`;
                    }

                    const cacheKey = `rag:tool_cache:summary:${documentId}:${summaryType}:${dataroomId}`;

                    return await this.executeWithCache(cacheKey, async () => {
                        const timeoutMs = 8000;

                        try {
                            const searchPromise = vectorSearchService.searchSimilarChunks(
                                'document summary overview main topics key findings',
                                dataroomId!,
                                [documentId],
                                {
                                    topK: 10,
                                    similarityThreshold: 0.2,
                                    metadataFilter: { documentIds: [documentId], dataroomId }
                                }
                            );

                            const timeoutPromise = new Promise<never>((_, reject) =>
                                setTimeout(() => reject(new Error('Summary timeout')), timeoutMs)
                            );

                            const searchResults = await Promise.race([searchPromise, timeoutPromise]);

                            if (searchResults.length === 0) {
                                return `No content found for document "${documentId}".`;
                            }

                            const docName = searchResults[0]?.metadata.documentName || 'Unknown Document';
                            const chunks = searchResults.slice(0, summaryType === 'detailed' ? 8 : summaryType === 'key_points' ? 5 : 3);
                            const contentLength = summaryType === 'detailed' ? 300 : summaryType === 'key_points' ? 200 : 150;

                            const formattedContent = chunks.map((result, index) => {
                                const content = result.content.substring(0, contentLength);
                                const pageInfo = result.metadata.pageRanges ? ` (Page ${result.metadata.pageRanges.join(', ')})` : '';
                                return `${index + 1}. ${content}${result.content.length > contentLength ? '...' : ''}${pageInfo}`;
                            }).join(summaryType === 'detailed' ? '\n\n' : '\n');

                            const title = summaryType === 'key_points' ? 'Key Points' :
                                summaryType === 'detailed' ? 'Detailed Summary' : 'Overview';

                            return `**${title} of ${docName}:**\n\n${formattedContent}`;
                        } catch (error) {
                            if (error instanceof Error && error.message.includes('timeout')) {
                                return 'Summary timeout: Please try again.';
                            }
                            throw error;
                        }
                    }, CACHE_TTL);
                }
            }
        };
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

                const stream = streamText({
                        model: this.getModel(),
                        system: prompt,
                        messages: [{ role: 'user', content: `Question: ${query}` }],
                    onFinish: async ({ text, usage, finishReason }) => {
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
                this.validateInputs(context, messages, query);

                const systemContent = await this.buildRAGSystemPrompt(context, pageNumbers, query);
                const tools = enableTools ? this.getResearchTools(dataroomId, documentIds) : undefined;

                const stream = streamText({
                    model: this.getModel(),
                    system: systemContent,
                    messages: [...convertToModelMessages(messages), { role: 'user', content: query }],
                    tools,
                    temperature: this.config.generation.temperature,
                    abortSignal,
                    onFinish: async ({ text, usage, finishReason }) => {
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