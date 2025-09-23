
import { RAGError } from '../errors/rag-errors';
import { AccessibleDocument } from '../document-permissions';
import { SearchResult } from '../types/rag-types';
import { UIMessage } from 'ai';
import { textGenerationService } from '../text-generation';
import { rerankerService } from './reranker.service';
import { DocumentSearchService, documentSearchService } from './document-search.service';
import { UnifiedQueryAnalysisResult } from './unified-query-analysis.service';
import prisma from "@/lib/prisma";
import { configurationManager } from '../config/configuration-manager';
import { ChatMetadataTracker } from './chat-metadata-tracker.service';
import pLimit from 'p-limit';

interface SearchConfigs {
    FAST: {
        topK: number;
        similarityThreshold: number;
        timeoutMs: number;
    };
    STANDARD: {
        topK: number;
        similarityThreshold: number;
        timeoutMs: number;
    };
    EXPANDED: {
        topK: number;
        similarityThreshold: number;
        timeoutMs: number;
    };
}

export type SearchStrategy = 'FastVectorSearch' | 'StandardVectorSearch' | 'ExpandedSearch' | 'PageQueryStrategy';

interface ComplexityAnalysis {
    complexityScore: number;
    complexityLevel: 'low' | 'medium' | 'high';
}

interface QueryExtraction {
    pageNumbers: number[];
}

interface PipelineContext {
    query: string;
    dataroomId: string;
    indexedDocuments: AccessibleDocument[];
    messages: UIMessage[];
    signal?: AbortSignal;
    complexityAnalysis?: ComplexityAnalysis;
    queryExtraction?: QueryExtraction & {
        queryRewriting?: UnifiedQueryAnalysisResult['queryRewriting']
    };
    intent: "extraction" | "summarization" | "comparison" | "concept_explanation" | "analysis" | "verification" | "general_inquiry";
    chatSessionId?: string;
    metadataTracker?: ChatMetadataTracker;
}

export class RAGOrchestratorService {
    private documentSearchService: DocumentSearchService;
    private searchConfigs: SearchConfigs;

    constructor(
        customDocumentSearchService?: DocumentSearchService,
    ) {
        this.documentSearchService = customDocumentSearchService || documentSearchService;
        this.searchConfigs = this.initializeSearchConfigs();
    }

    private initializeSearchConfigs(): SearchConfigs {
        const ragConfig = configurationManager.getRAGConfig();
        return {
            FAST: {
                topK: ragConfig.search.fastTopK,
                similarityThreshold: ragConfig.search.fastSimilarityThreshold,
                timeoutMs: ragConfig.search.fastTopK * 3000
            },
            STANDARD: {
                topK: ragConfig.search.standardTopK,
                similarityThreshold: ragConfig.search.standardSimilarityThreshold,
                timeoutMs: ragConfig.search.standardTopK * 3000
            },
            EXPANDED: {
                topK: ragConfig.search.expandedTopK,
                similarityThreshold: ragConfig.search.expandedSimilarityThreshold,
                timeoutMs: ragConfig.search.expandedTopK * 3000
            }
        };
    }

    async processQuery(
        query: string,
        dataroomId: string,
        indexedDocuments: AccessibleDocument[],
        messages: UIMessage[],
        strategy: SearchStrategy = 'StandardVectorSearch',
        intent: "extraction" | "summarization" | "comparison" | "concept_explanation" | "analysis" | "verification" | "general_inquiry",
        complexityAnalysis?: ComplexityAnalysis,
        queryExtraction?: QueryExtraction & {
            queryRewriting?: UnifiedQueryAnalysisResult['queryRewriting']
        },
        timeoutMs: number = 50000, // 50 sec
        abortSignal?: AbortSignal,
        chatSessionId?: string,
        metadataTracker?: ChatMetadataTracker
    ): Promise<Response> {
        return RAGError.withErrorHandling(
            async () => {
                if (process.env.NODE_ENV === 'development') {
                    console.log('🚀 RAG Query Processing:', {
                        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
                        strategy,
                        intent,
                        documentsCount: indexedDocuments.length,
                        chatSessionId
                    });
                }

                this.validateInputs(query, dataroomId, indexedDocuments, messages, strategy);

                // Initialize metadata tracking
                if (metadataTracker) {
                    metadataTracker.startTotal();
                    metadataTracker.setQueryAnalysis({
                        queryType: 'document_question',
                        intent,
                        complexityLevel: complexityAnalysis?.complexityLevel
                    });
                    metadataTracker.setSearchStrategy({
                        strategy,
                        confidence: 1.0 // Default confidence
                    });
                }

                try {
                    const timeoutSignal = AbortSignal.timeout(timeoutMs);
                    const pipelineSignal = abortSignal || timeoutSignal;

                    if (queryExtraction?.pageNumbers && queryExtraction.pageNumbers.length > 0) {
                        const pageValidation = this.validatePagesAgainstDocuments(queryExtraction.pageNumbers, indexedDocuments);

                        if (!pageValidation.isValid && pageValidation.errorMessage) {
                            const fallbackResponse = await textGenerationService.generateFallbackResponse(
                                pageValidation.errorMessage,
                                chatSessionId,
                                metadataTracker
                            );

                            if (metadataTracker) {
                                metadataTracker.setError({
                                    type: 'InvalidPageRequest',
                                    message: pageValidation.errorMessage,
                                    isRetryable: false
                                });
                                metadataTracker.endTotal();
                            }

                            return fallbackResponse;
                        }
                    }

                    const context: PipelineContext = {
                        query,
                        dataroomId,
                        indexedDocuments,
                        messages,
                        signal: pipelineSignal,
                        complexityAnalysis,
                        queryExtraction,
                        intent,
                        chatSessionId,
                        metadataTracker
                    };

                    const result = await this.executeStrategyPipeline(strategy, context);

                    // Complete metadata tracking
                    if (metadataTracker) {
                        metadataTracker.endTotal();
                    }

                    return result;

                } catch (error) {

                    // Track error in metadata
                    if (metadataTracker) {
                        metadataTracker.setError({
                            type: error instanceof Error ? error.name : 'UnknownError',
                            message: error instanceof Error ? error.message : String(error),
                            isRetryable: error instanceof Error && !error.message.includes('aborted')
                        });
                        metadataTracker.endTotal();
                    }

                    // Check if it's an abort error (user clicked stop)
                    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted') || abortSignal?.aborted)) {
                        throw error;
                    }

                    // Check if it's a timeout error
                    if (error instanceof Error && error.name === 'TimeoutError') {
                        return await textGenerationService.generateFallbackResponse(
                            "The request took too long to process. Please try a simpler query or try again later.",
                            chatSessionId,
                            metadataTracker
                        );
                    }

                    return await textGenerationService.generateFallbackResponse(
                        "An error occurred while processing your request. Please try again.",
                        chatSessionId,
                        metadataTracker
                    );
                }
            },
            'llmCall',
            { service: 'RAGOrchestrator', operation: 'processQuery' }
        );
    }

    /**
     * Strategy-based pipeline execution
     */
    private async executeStrategyPipeline(strategy: SearchStrategy, context: PipelineContext) {
        if (strategy === 'PageQueryStrategy') {
            return await this.executePageQueryPipeline(context);
        }

        try {
            const searchQueries = this.buildQueriesForStrategy(context, strategy);
            const searchResults = await this.performVectorSearch(searchQueries, context, strategy);

            if (searchResults.length === 0) {
                return await textGenerationService.generateFallbackResponse(
                    "No relevant documents found for your query.",
                    context.chatSessionId,
                    context.metadataTracker
                );
            }

            return await this.executeSharedProcessingPipeline(context, searchResults);
        } catch (error) {
            throw error;
        }
    }

    private async executePageQueryPipeline(context: PipelineContext) {
        try {
            const requestedPages = context.queryExtraction?.pageNumbers || [];

            if (requestedPages.length === 0) {
                return await textGenerationService.generateFallbackResponse(
                    "No page numbers were specified in your query.",
                    context.chatSessionId,
                    context.metadataTracker
                );
            }

            const searchResults = await this.queryChunksByPageNumbers(
                requestedPages,
                context.dataroomId,
                context.indexedDocuments.map(doc => doc.documentId)
            );


            if (searchResults.length === 0) {
                return await textGenerationService.generateFallbackResponse(
                    `I couldn't find any content on page(s) ${requestedPages.join(', ')}. The page(s) might not exist or may not have been indexed yet.`,
                    context.chatSessionId,
                    context.metadataTracker
                );
            }

            const contextText = this.formatContextWithPageInfo(searchResults, requestedPages);

            if (context.metadataTracker) {
                context.metadataTracker.addSearchResults({
                    chunkIds: searchResults.map(c => c.chunkId),
                    documentIds: [...new Set(searchResults.map(c => c.documentId))],
                    totalSearchResults: searchResults.length,
                    allocatedChunks: searchResults.length,
                    avgRelevanceScore: 1.0
                });
            }

            const enableTools = this.shouldEnableTools(context);

            if (context.metadataTracker) {
                const ragConfig = configurationManager.getRAGConfig();
                context.metadataTracker.setGenerationConfig({
                    modelUsed: ragConfig.llm.model,
                    temperature: ragConfig.generation.temperature,
                    toolsEnabled: enableTools
                });
            }

            if (process.env.NODE_ENV === 'development') {
                console.log('📄 Context Details:', {
                    contextLength: contextText.length,
                    contextPreview: contextText.substring(0, 200) + (contextText.length > 200 ? '...' : ''),
                    searchResultsCount: searchResults.length,
                    topResults: searchResults.slice(0, 3).map((r: any) => ({
                        content: r.content.substring(0, 100) + '...',
                        pageRanges: r.metadata.pageRanges,
                        similarity: r.similarity
                    }))
                });
            }

            const response = await textGenerationService.generateRAGResponseWithTools(
                contextText,
                context.messages,
                context.query,
                enableTools,
                context.signal,
                context.chatSessionId,
                context.metadataTracker,
                requestedPages,
                context.dataroomId,
                context.indexedDocuments.map(doc => doc.documentId)
            );

            if (process.env.NODE_ENV === 'development') {
                console.log('✅ Page Query Response Generated:', {
                    strategy: 'PageQueryStrategy',
                    intent: context.intent,
                    chatSessionId: context.chatSessionId,
                    documentsCount: context.indexedDocuments.length
                });
            }

            return response;

        } catch (error) {
            throw error;
        }
    }

    private async executeSharedProcessingPipeline(
        context: PipelineContext,
        searchResults: SearchResult[]
    ) {
        try {
            let processedResults = searchResults;

            if (searchResults.length >= 20) {
                try {
                    const rerankStart = Date.now();
                    const topResults = searchResults.slice(0, 30);

                    processedResults = await rerankerService.rerankResults(
                        context.query,
                        topResults,
                    );

                    const rerankTime = Date.now() - rerankStart;
                    if (context.metadataTracker) {
                        context.metadataTracker.setReranking({
                            wasReranked: true,
                            threshold: 20,
                            inputCount: topResults.length,
                            outputCount: processedResults.length,
                            rerankTime
                        });
                    }
                } catch (error) {
                    processedResults = searchResults;
                    if (context.metadataTracker) {
                        context.metadataTracker.setReranking({
                            wasReranked: false,
                            threshold: 20,
                            inputCount: searchResults.length,
                            outputCount: searchResults.length,
                            rerankTime: 0
                        });
                    }
                }
            } else {
                if (context.metadataTracker) {
                    context.metadataTracker.setReranking({
                        wasReranked: false,
                        threshold: 20,
                        inputCount: searchResults.length,
                        outputCount: searchResults.length,
                        rerankTime: 0
                    });
                }
            }

            const allocatedChunks = this.allocateChunks(processedResults, context.intent);

            const contextText = this.formatContextWithCitations(allocatedChunks);

            if (process.env.NODE_ENV === 'development') {
                console.log('📄 Context Details:', {
                    contextLength: contextText.length,
                    contextPreview: contextText.substring(0, 200) + (contextText.length > 200 ? '...' : ''),
                    searchResultsCount: allocatedChunks.length,
                    topResults: allocatedChunks.slice(0, 3).map((r: any) => ({
                        content: r.content.substring(0, 100) + '...',
                        similarity: r.similarity,
                        relevanceScore: r.relevanceScore
                    }))
                });
            }

            if (context.metadataTracker) {
                context.metadataTracker.addSearchResults({
                    chunkIds: allocatedChunks.map(c => c.chunkId),
                    documentIds: [...new Set(allocatedChunks.map(c => c.documentId))],
                    totalSearchResults: searchResults.length,
                    allocatedChunks: allocatedChunks.length,
                    avgRelevanceScore: allocatedChunks.reduce((sum, c) => sum + c.similarity, 0) / allocatedChunks.length
                });

                context.metadataTracker.setContextCompression({
                    strategy: 'SmartAllocation',
                    originalSize: searchResults.length,
                    compressedSize: allocatedChunks.length,
                    efficiency: allocatedChunks.length / Math.ceil(contextText.length / 4)
                });
            }

            const enableTools = this.shouldEnableTools(context);
            if (context.metadataTracker) {
                const ragConfig = configurationManager.getRAGConfig();
                context.metadataTracker.setGenerationConfig({
                    modelUsed: ragConfig.llm.model,
                    temperature: ragConfig.generation.temperature,
                    toolsEnabled: enableTools
                });
            }

            return await textGenerationService.generateRAGResponseWithTools(
                contextText,
                context.messages,
                context.query,
                enableTools,
                context.signal,
                context.chatSessionId,
                context.metadataTracker,
                context.queryExtraction?.pageNumbers,
                context.dataroomId,
                context.indexedDocuments.map(doc => doc.documentId)
            );

        } catch (error) {
            return await textGenerationService.generateFallbackResponse(
                "An error occurred while processing your request. Please try again.",
                context.chatSessionId,
                context.metadataTracker
            );
        }
    }

    private buildQueriesForStrategy(context: PipelineContext, strategy: SearchStrategy): string[] {
        const queries: string[] = [context.query];
        const maxQueries = this.getMaxQueriesForStrategy(strategy);

        const shouldUseRewrittenQueries = context.queryExtraction?.queryRewriting?.rewrittenQueries?.length &&
            context.queryExtraction?.queryRewriting?.rewrittenQueries;

        if (shouldUseRewrittenQueries && context.queryExtraction?.queryRewriting?.rewrittenQueries) {
            const rewrittenQueries = context.queryExtraction.queryRewriting.rewrittenQueries
                .slice(0, maxQueries - 1)
                .filter((query): query is string => query !== undefined);
            queries.push(...rewrittenQueries);
        }
        if (strategy === 'ExpandedSearch' &&
            context.queryExtraction?.queryRewriting?.hydeAnswer &&
            context.queryExtraction.queryRewriting.requiresHyde) {
            queries.push(context.queryExtraction.queryRewriting.hydeAnswer);
        }

        const finalQueries = Array.from(new Set(queries.map(q => q.trim()).filter(Boolean)));

        return finalQueries;
    }

    private getMaxQueriesForStrategy(strategy: SearchStrategy): number {
        switch (strategy) {
            case 'FastVectorSearch': return 2;
            case 'StandardVectorSearch': return 4;
            case 'ExpandedSearch': return 6;
            case 'PageQueryStrategy': return 2;
            default: return 2;
        }
    }

    private async performVectorSearch(
        searchQueries: string[],
        context: PipelineContext,
        strategy: SearchStrategy
    ): Promise<SearchResult[]> {
        const config = this.getSearchConfig(strategy);
        const docIds = context.indexedDocuments.map(doc => doc.documentId);
        const allResults: SearchResult[] = [];
        const metadataFilter = this.buildMetadataFilter(context);

        const hasPageNumbers = context.queryExtraction?.pageNumbers && context.queryExtraction.pageNumbers.length > 0;
        const useMetadataFilter = hasPageNumbers && metadataFilter;

        try {
            if (context.metadataTracker) {
                context.metadataTracker.startSearch();
            }
            const limit = pLimit(5);
            const searchPromises = searchQueries.map((query, index) =>
                limit(async () => {
                    if (context.signal?.aborted) {
                        throw new Error('Vector search aborted before start');
                    }

                    try {
                        const results = await Promise.race([
                            this.documentSearchService.performVectorSearchInternal(
                                query,
                                context.dataroomId,
                                docIds,
                                context.signal,
                                { topK: config.topK, similarityThreshold: config.similarityThreshold },
                                useMetadataFilter ? metadataFilter || undefined : undefined
                            ),
                            new Promise<SearchResult[]>((_, reject) => {
                                const timeoutId = setTimeout(() =>
                                    reject(new Error(`Query timeout after ${config.timeoutMs}ms`)),
                                    config.timeoutMs
                                );
                                if (context.signal) {
                                    context.signal.addEventListener('abort', () => {
                                        clearTimeout(timeoutId);
                                        reject(new Error('Vector search aborted'));
                                    });
                                }
                            })
                        ]);

                        return results;
                    } catch (error) {
                        return [];
                    }
                })
            );

            const queryResults = await Promise.all(searchPromises);

            queryResults.forEach((results, index) => {
                allResults.push(...results);
            });

            const uniqueResults = this.removeDuplicateResults(allResults);

            if (context.metadataTracker) {
                context.metadataTracker.endSearch();
                const chunkIds = uniqueResults.map(r => r.chunkId);
                const documentIds = [...new Set(uniqueResults.map(r => r.documentId))];
                const pageRanges = [...new Set(uniqueResults.flatMap(r => r.metadata.pageRanges))];

                context.metadataTracker.addSearchResults({
                    chunkIds,
                    documentIds,
                    pageRanges: pageRanges.map(p => p.toString())
                });
            }

            return uniqueResults;

        } catch (error) {
            throw error;
        }
    }

    private getSearchConfig(strategy: SearchStrategy) {
        switch (strategy) {
            case 'FastVectorSearch': return this.searchConfigs.FAST;
            case 'StandardVectorSearch': return this.searchConfigs.STANDARD;
            case 'ExpandedSearch': return this.searchConfigs.EXPANDED;
            default: return this.searchConfigs.STANDARD;
        }
    }

    private removeDuplicateResults(results: SearchResult[]): SearchResult[] {
        const seen = new Set<string>();
        return results.filter(result => {
            if (seen.has(result.chunkId)) {
                return false;
            }
            seen.add(result.chunkId);
            return true;
        });
    }

    private buildMetadataFilter(context: PipelineContext): {
        documentIds?: string[];
        pageRanges?: string[];
        dataroomId?: string;
    } | null {
        const filter: any = {};

        filter.dataroomId = context.dataroomId;

        if (context.indexedDocuments && context.indexedDocuments.length > 0) {
            filter.documentIds = context.indexedDocuments.map(doc => doc.documentId);
        }

        const pageNumbers = context.queryExtraction?.pageNumbers;
        if (pageNumbers && pageNumbers.length > 0) {
            filter.pageRanges = pageNumbers.map(pageNum => pageNum.toString());
        }

        return Object.keys(filter).length > 1 ? filter : null;
    }

    private async queryChunksByPageNumbers(
        pageNumbers: number[],
        dataroomId: string,
        documentIds: string[]
    ): Promise<SearchResult[]> {
        return RAGError.withErrorHandling(
            async () => {
                if (pageNumbers.length === 0 || documentIds.length === 0) {
                    return [];
                }

                const pageConditions = pageNumbers.map(pageNum => {
                    return {
                        OR: [
                            { pageRanges: pageNum.toString() },
                            { pageRanges: { contains: `, ${pageNum},` } },
                            { pageRanges: { startsWith: `${pageNum}, ` } },
                            { pageRanges: { endsWith: `, ${pageNum}` } },
                            { pageRanges: { contains: `-${pageNum}-` } },
                            { pageRanges: { startsWith: `${pageNum}-` } },
                            { pageRanges: { endsWith: `-${pageNum}` } }
                        ]
                    };
                });

                const chunks = await prisma.documentChunk.findMany({
                    where: {
                        dataroomId: dataroomId,
                        documentId: { in: documentIds },
                        OR: pageConditions
                    },
                    orderBy: [
                        { documentId: 'asc' },
                        { chunkIndex: 'asc' }
                    ]
                });
                const chunksByPage = new Map<number, typeof chunks>();
                pageNumbers.forEach(pageNum => {
                    const pageChunks = chunks.filter(chunk => {
                        if (!chunk.pageRanges) return false;
                        const pageRanges = chunk.pageRanges.split(',').map(range => range.trim());
                        return pageRanges.some(range => {
                            if (range.includes('-')) {
                                const [start, end] = range.split('-').map(n => parseInt(n.trim()));
                                return pageNum >= start && pageNum <= end;
                            } else {
                                return parseInt(range) === pageNum;
                            }
                        });
                    });
                    chunksByPage.set(pageNum, pageChunks);
                });

                const searchResults: SearchResult[] = chunks.map(chunk => ({
                    chunkId: chunk.id,
                    documentId: chunk.documentId,
                    content: chunk.content,
                    similarity: 1.0,
                    metadata: {
                        pageRanges: chunk.pageRanges ? [chunk.pageRanges] : [],
                        sectionHeader: chunk.sectionHeader || undefined,
                        chunkIndex: chunk.chunkIndex,
                        documentName: '',
                        headerHierarchy: chunk.headerHierarchy ? JSON.parse(chunk.headerHierarchy) : [],
                        isSmallChunk: chunk.isSmallChunk || false,
                        startLine: chunk.startLine || undefined,
                        endLine: chunk.endLine || undefined,
                        tokenCount: chunk.tokenCount || 0,
                        contentType: chunk.contentType || 'pdf',
                        dataroomId: chunk.dataroomId,
                        teamId: chunk.teamId
                    }
                }));

                return searchResults;
            },
            'databaseQuery',
            { service: 'RAGOrchestrator', operation: 'queryChunksByPageNumbers', pageNumbers, dataroomId }
        );
    }

    private allocateChunks(searchResults: SearchResult[], intent: string): SearchResult[] {
        if (searchResults.length === 0) {
            return [];
        }
        const thresholds = [0.6, 0.5, 0.4, 0.3, 0.2];
        const maxChunks = this.getOptimalChunkCount(intent, searchResults.length);

        let selectedResults: SearchResult[] = [];
        for (const threshold of thresholds) {
            const candidates = searchResults.filter(result => result.similarity >= threshold);

            if (candidates.length >= maxChunks || threshold === thresholds[thresholds.length - 1]) {
                selectedResults = candidates.slice(0, maxChunks);
                break;
            }
        }
        const finalResults: SearchResult[] = [];
        const documentCount = new Map<string, number>();

        for (const result of selectedResults) {
            const docId = result.documentId;
            const currentCount = documentCount.get(docId) || 0;

            if (currentCount < 5) {
                finalResults.push(result);
                documentCount.set(docId, currentCount + 1);
            }
        }
        return finalResults;
    }

    private getOptimalChunkCount(intent: string, availableResults: number): number {
        const intentChunkMap: Record<string, number> = {
            'extraction': 8,
            'summarization': 12,
            'comparison': 10,
            'analysis': 8,
            'verification': 6,
            'concept_explanation': 10,
            'general_inquiry': 6
        };

        const baseChunks = intentChunkMap[intent] || 6;
        return Math.min(Math.max(4, baseChunks), availableResults);
    }

    private formatContextWithCitations(searchResults: SearchResult[]): string {
        if (searchResults.length === 0) {
            return '';
        }

        const formattedChunks = searchResults
            .map((result, index) => {
                const citationId = `[${index + 1}]`;
                const maxContentLength = 2800;
                const content = result.content.length > maxContentLength
                    ? result.content.substring(0, maxContentLength) + '...'
                    : result.content;

                return `${citationId} ${content}`;
            })
            .join('\n\n');

        return formattedChunks;
    }

    private formatContextWithPageInfo(searchResults: SearchResult[], requestedPages: number[]): string {
        if (searchResults.length === 0) {
            return '';
        }
        let contextHeader = `PAGE QUERY: Content from page(s) ${requestedPages.join(', ')}:\n\n`;

        const formattedChunks = searchResults
            .map((result, index) => {
                const citationId = `[${index + 1}]`;
                const pageInfo = result.metadata.pageRanges?.[0] ? ` (Page: ${result.metadata.pageRanges[0]})` : '';
                const maxContentLength = 2800;
                const content = result.content.length > maxContentLength
                    ? result.content.substring(0, maxContentLength) + '...'
                    : result.content;

                return `${citationId}${pageInfo} ${content}`;
            })
            .join('\n\n');

        return contextHeader + formattedChunks;
    }

    private validatePagesAgainstDocuments(
        requestedPages: number[],
        indexedDocuments: AccessibleDocument[]
    ): { isValid: boolean; errorMessage?: string } {
        if (!requestedPages || requestedPages.length === 0) {
            return { isValid: true };
        }

        if (!indexedDocuments || indexedDocuments.length === 0) {
            return {
                isValid: false,
                errorMessage: 'No documents available to validate pages against'
            };
        }

        const maxPagesInDocuments = Math.max(...indexedDocuments.map(doc => doc.numPages || 0));

        if (maxPagesInDocuments === 0) {
            return {
                isValid: false,
                errorMessage: 'Documents have no page information available'
            };
        }

        const invalidPages = requestedPages.filter(page => page < 1 || page > maxPagesInDocuments);

        if (invalidPages.length === 0) {
            return { isValid: true };
        }

        const invalidPageList = invalidPages.join(', ');
        const documentNames = indexedDocuments.map(doc => doc.documentName || 'Unknown Document').join(', ');

        if (invalidPages.length === 1) {
            return {
                isValid: false,
                errorMessage: `Page ${invalidPageList} doesn't exist in your documents. The available documents (${documentNames}) have ${maxPagesInDocuments} page${maxPagesInDocuments === 1 ? '' : 's'} (pages 1-${maxPagesInDocuments}). Try asking about content within that range.`
            };
        } else {
            return {
                isValid: false,
                errorMessage: `Pages ${invalidPageList} don't exist in your documents. The available documents (${documentNames}) have ${maxPagesInDocuments} page${maxPagesInDocuments === 1 ? '' : 's'} (pages 1-${maxPagesInDocuments}). Try asking about content within that range.`
            };
        }
    }

    private validateInputs(
        query: string,
        dataroomId: string,
        indexedDocuments: AccessibleDocument[],
        messages: UIMessage[],
        strategy: SearchStrategy
    ): void {
        if (!query?.trim()) {
            throw RAGError.create('validation', 'Query is required', { field: 'query' });
        }
        if (!dataroomId?.trim()) {
            throw RAGError.create('validation', 'Dataroom ID is required', { field: 'dataroomId' });
        }
        if (!indexedDocuments?.length) {
            throw RAGError.create('validation', 'Indexed documents are required', { field: 'indexedDocuments' });
        }
        if (!messages?.length) {
            throw RAGError.create('validation', 'Messages are required', { field: 'messages' });
        }
        if (!this.isValidStrategy(strategy)) {
            throw RAGError.create('validation', `Invalid search strategy: ${strategy}`, { field: 'strategy' });
        }
        if (query.length > 10000) {
            throw RAGError.create('validation', 'Query too long (max 10,000 characters)', { field: 'query' });
        }
    }

    private isValidStrategy(strategy: string): strategy is SearchStrategy {
        return ['FastVectorSearch', 'StandardVectorSearch', 'ExpandedSearch', 'PageQueryStrategy'].includes(strategy);
    }

    private shouldEnableTools(context: PipelineContext): boolean {
        const complexityScore = context.complexityAnalysis?.complexityScore || 0;
        const intent = context.intent;
        return complexityScore > 0.6 || intent === 'analysis' || intent === 'comparison' || intent === 'summarization';
    }

}

export const ragOrchestratorService = new RAGOrchestratorService();