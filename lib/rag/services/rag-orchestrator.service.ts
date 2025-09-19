
import { RAGError } from '../errors/rag-errors';
import { AccessibleDocument } from '../document-permissions';
import { SearchResult } from '../types/rag-types';
import { UIMessage } from 'ai';
import { ResponseGenerationService, responseGenerationService } from './response-generation.service';
import { rerankerService } from './reranker.service';
import { contextCompressionService } from './context-compression.service';
import { DocumentSearchService, documentSearchService } from './document-search.service';
import { DocumentGradingService, documentGradingService } from './document-grading.service';
import { UnifiedQueryAnalysisResult } from './unified-query-analysis.service';
import { configurationManager } from '../config/configuration-manager';
import { ChatMetadataTracker } from './chat-metadata-tracker.service';


interface SearchConfig {
    topK: number;
    similarityThreshold: number;
    timeoutMs: number;
}

interface SearchConfigs {
    FAST: SearchConfig;
    STANDARD: SearchConfig;
    EXPANDED: SearchConfig;
    PAGE_QUERY: SearchConfig;
}

export type SearchStrategy = 'FastVectorSearch' | 'StandardVectorSearch' | 'ExpandedSearch' | 'PageQueryStrategy';

interface ComplexityAnalysis {
    complexityScore: number;
    complexityLevel: 'low' | 'medium' | 'high';
    wordCount: number;
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
    private documentGradingService: DocumentGradingService;
    private responseGenerationService: ResponseGenerationService;
    private searchConfigs: SearchConfigs;
    private isDisposed = false;
    private readonly MAX_TOKENS_PER_CHAT = 5000;

    constructor(
        customDocumentSearchService?: DocumentSearchService,
        customDocumentGradingService?: DocumentGradingService,
        customResponseGenerationService?: ResponseGenerationService,
    ) {
        this.documentSearchService = customDocumentSearchService || documentSearchService;
        this.documentGradingService = customDocumentGradingService || documentGradingService;
        this.responseGenerationService = customResponseGenerationService || responseGenerationService;
        this.searchConfigs = this.initializeSearchConfigs();
    }

    private checkTokenBudget(metadataTracker?: ChatMetadataTracker): boolean {
        if (!metadataTracker) return true;

        const currentTokens = metadataTracker.getMetadata().totalTokens || 0;
        if (currentTokens > this.MAX_TOKENS_PER_CHAT) {
            console.warn(`Token budget exceeded: ${currentTokens}/${this.MAX_TOKENS_PER_CHAT}`);
            return false;
        }
        return true;
    }

    private initializeSearchConfigs(): SearchConfigs {
        const ragConfig = configurationManager.getRAGConfig();
        return {
            FAST: {
                topK: ragConfig.search.fastTopK,
                similarityThreshold: ragConfig.search.fastSimilarityThreshold,
                timeoutMs: ragConfig.search.fastTopK * 3000 // Dynamic timeout based on topK
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
            },
            PAGE_QUERY: {
                topK: ragConfig.search.pageQueryTopK,
                similarityThreshold: ragConfig.search.pageQuerySimilarityThreshold,
                timeoutMs: ragConfig.search.pageQueryTimeoutMs
            }
        };
    }

    /**
     * Main orchestration method with enhanced pipeline and real-time updates
     */
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
        timeoutMs: number = 50000, // Default 50 seconds for RAG processing
        abortSignal?: AbortSignal,
        chatSessionId?: string,
        metadataTracker?: ChatMetadataTracker
    ): Promise<Response> {
        return RAGError.withErrorHandling(
            async () => {
                if (this.isDisposed) {
                    throw RAGError.create('serviceDisposed', undefined, { service: 'RAGOrchestratorService' });
                }

                if (!this.checkTokenBudget(metadataTracker)) {
                    throw RAGError.create('tokenLimitExceeded', 'Token budget exceeded for this chat session', { service: 'RAGOrchestratorService' });
                }

                this.validateInputs(query, dataroomId, indexedDocuments, messages, strategy);

                const correlationId = this.generateCorrelationId();
                const startTime = Date.now();

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

                this.logPipelineStatus('🚀 STARTING', `RAG Pipeline: ${strategy} | "${query}" | ${correlationId}`);

                try {
                    const timeoutSignal = AbortSignal.timeout(timeoutMs);
                    const pipelineSignal = abortSignal || timeoutSignal;

                    if (queryExtraction?.pageNumbers && queryExtraction.pageNumbers.length > 0) {
                        const pageValidation = this.validatePagesAgainstDocuments(queryExtraction.pageNumbers, indexedDocuments);

                        if (!pageValidation.isValid && pageValidation.errorMessage) {
                            const fallbackResponse = await this.responseGenerationService.generateAnswer(
                                '', // Empty context triggers fallback
                                messages,
                                pageValidation.errorMessage,
                                pipelineSignal,
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

                    const totalTime = Date.now() - startTime;
                    const metrics = this.getPipelineMetrics(startTime, 1, strategy);
                    this.logPipelineStatus('✅ COMPLETE', `${strategy} | ${totalTime}ms`, metrics);

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
                        this.logPipelineStatus('🛑 ABORTED', `Pipeline aborted gracefully by user [${correlationId}]`);
                        throw error;
                    }

                    // Check if it's a timeout error
                    if (error instanceof Error && error.name === 'TimeoutError') {
                        this.logPipelineStatus('⏰ TIMEOUT', `Pipeline exceeded ${timeoutMs}ms limit`);
                        return await this.responseGenerationService.generateAnswer(
                            '', // Empty context triggers fallback
                            messages,
                            "The request took too long to process. Please try a simpler query or try again later.",
                            abortSignal,
                            chatSessionId,
                            metadataTracker
                        );
                    }

                    this.logPipelineStatus('❌ FAILED', `${error instanceof Error ? error.message : 'Unknown error'}`);

                    return await this.responseGenerationService.generateAnswer(
                        '', // Empty context triggers fallback
                        messages,
                        query,
                        abortSignal,
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
        switch (strategy) {
            case 'FastVectorSearch':
                return await this.executeFastVectorPipeline(context);
            case 'StandardVectorSearch':
                return await this.executeStandardPipeline(context);
            case 'ExpandedSearch':
                return await this.executeExpandedPipeline(context);
            case 'PageQueryStrategy':
                return await this.executePageQueryPipeline(context);
            default:
                return await this.executeStandardPipeline(context);
        }
    }

    /**
     * Fast Vector Pipeline
     */
    private async executeFastVectorPipeline(context: PipelineContext) {
        this.logPipelineStatus('⚡ FAST_PIPELINE', 'Starting optimized fast pipeline...');

        try {
            const searchQueries = this.buildQueriesForStrategy(context, 'FastVectorSearch');
            this.logPipelineStatus('🔍 FAST_QUERIES', `Using ${searchQueries.length} optimized queries`);

            const searchResults = await this.performVectorSearch(searchQueries, context, 'FastVectorSearch');

            if (searchResults.length === 0) {
                this.logPipelineStatus('⚠️ NO_RESULTS', 'No results found, generating fallback response...');
                return await this.responseGenerationService.generateAnswer(
                    '', // Empty context triggers fallback
                    context.messages,
                    context.query,
                    context.signal,
                    context.chatSessionId,
                    context.metadataTracker
                );
            }

            return await this.executeSharedProcessingPipeline(context, searchResults, 'FastVectorSearch');

        } catch (error) {
            this.logPipelineStatus('❌ FAST_PIPELINE_FAILED', `${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Standard Pipeline
     */
    private async executeStandardPipeline(context: PipelineContext) {
        this.logPipelineStatus('🔄 STANDARD_PIPELINE', 'Starting full pipeline...');

        try {
            const searchQueries = this.buildQueriesForStrategy(context, 'StandardVectorSearch');
            this.logPipelineStatus('🔍 STANDARD_QUERIES', `Using ${searchQueries.length} queries`);

            const searchResults = await this.performVectorSearch(searchQueries, context, 'StandardVectorSearch');

            if (searchResults.length === 0) {
                this.logPipelineStatus('⚠️ NO_RESULTS', 'No results found, generating fallback response...');
                return await this.responseGenerationService.generateAnswer(
                    '', // Empty context triggers fallback
                    context.messages,
                    context.query,
                    context.signal,
                    context.chatSessionId,
                    context.metadataTracker
                );
            }

            return await this.executeSharedProcessingPipeline(context, searchResults, 'StandardVectorSearch');

        } catch (error) {
            this.logPipelineStatus('❌ STANDARD_PIPELINE_FAILED', `${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Expanded Pipeline
     */
    private async executeExpandedPipeline(context: PipelineContext) {
        this.logPipelineStatus('🚀 EXPANDED_PIPELINE', 'Starting enhanced pipeline...');

        try {
            const searchQueries = this.buildQueriesForStrategy(context, 'ExpandedSearch');
            this.logPipelineStatus('🔍 EXPANDED_QUERIES', `Using ${searchQueries.length} queries`);

            const searchResults = await this.performVectorSearch(searchQueries, context, 'ExpandedSearch');

            if (searchResults.length === 0) {
                this.logPipelineStatus('⚠️ NO_RESULTS', 'No results found, generating fallback response...');
                return await this.responseGenerationService.generateAnswer(
                    '', // Empty context triggers fallback
                    context.messages,
                    context.query,
                    context.signal,
                    context.chatSessionId,
                    context.metadataTracker
                );
            }

            return await this.executeSharedProcessingPipeline(context, searchResults, 'ExpandedSearch');

        } catch (error) {
            this.logPipelineStatus('❌ EXPANDED_PIPELINE_FAILED', `${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    private async executePageQueryPipeline(context: PipelineContext) {
        this.logPipelineStatus('PAGE_QUERY_PIPELINE', 'Starting fast page-specific pipeline...');

        try {
            const searchQueries = [context.query];

            const searchResults = await this.performVectorSearch(searchQueries, context, 'PageQueryStrategy');

            if (searchResults.length === 0) {
                this.logPipelineStatus('⚠️ NO_PAGE_RESULTS', 'No results found for requested page, generating fallback response...');
                return await this.responseGenerationService.generateAnswer(
                    '', // Empty context triggers fallback
                    context.messages,
                    `I couldn't find any content on the requested page. The page might not exist or may not have been indexed yet.`,
                    context.signal,
                    context.chatSessionId,
                    context.metadataTracker
                );
            }

            // Skip source building - not neede
            const contextText = searchResults.map(r => r.content).join('\n\n');
            const validPages = context.queryExtraction?.pageNumbers || [];

            const response = await this.responseGenerationService.generateAnswer(
                contextText,
                context.messages,
                context.query,
                context.signal,
                context.chatSessionId,
                context.metadataTracker,
                validPages
            );

            this.logPipelineStatus('✅ PAGE_RESPONSE_COMPLETE', 'Generated page response');
            return response;

        } catch (error) {
            this.logPipelineStatus('❌ PAGE_PIPELINE_FAILED', `${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    private async executeSharedProcessingPipeline(
        context: PipelineContext,
        searchResults: SearchResult[],
        strategyName: string
    ) {
        try {
            const isFastPath = strategyName === 'FastVectorSearch';

            if (isFastPath) {
                this.logPipelineStatus('⚡ FAST_PATH_OPTIMIZATION', 'Using optimized processing for speed...');

                const contextText = searchResults.map(r => r.content).join('\n\n');

                const response = await this.responseGenerationService.generateAnswer(
                    contextText,
                    context.messages,
                    context.query,
                    context.signal,
                    context.chatSessionId,
                    context.metadataTracker,
                    context.queryExtraction?.pageNumbers
                );

                this.logPipelineStatus('✅ FAST_RESPONSE_COMPLETE', 'Generated fast response');
                return response;
            }


            this.logPipelineStatus('⚙️ PHASE_3', 'Parallel reranking and context compression...');

            let rerankedResults: any[];
            let compressedContext: any;

            try {
                // PARALLEL EXECUTION: Run reranking and compression simultaneously
                const [rerankResult, compressionResult] = await Promise.allSettled([
                    rerankerService.rerankResults(context.query, searchResults, context.signal),
                    contextCompressionService.compressContext(searchResults, context.query, context.signal, context.complexityAnalysis)
                ]);

                // Handle reranking result
                if (rerankResult.status === 'fulfilled') {
                    rerankedResults = rerankResult.value;
                    this.logPipelineStatus('✅ RERANKING_COMPLETE', `${strategyName}: Reranked ${rerankedResults.length} results`);
                } else {
                    rerankedResults = searchResults;
                    this.logPipelineStatus('⚠️ RERANKING_FAILED', 'Using original search results');
                }

                // Handle compression result
                if (compressionResult.status === 'fulfilled') {
                    compressedContext = compressionResult.value;
                    this.logPipelineStatus('✅ COMPRESSION_COMPLETE', `${strategyName}: Context compressed`);
                } else {
                    compressedContext = {
                        content: rerankedResults.map(r => r.content).join('\n\n'),
                    };
                    this.logPipelineStatus('⚠️ COMPRESSION_FAILED', 'Using uncompressed context');
                }

            } catch (error) {
                // Fallback to sequential processing
                rerankedResults = await rerankerService.rerankResults(context.query, searchResults, context.signal);
                compressedContext = {
                    content: rerankedResults.map(r => r.content).join('\n\n'),
                };
                this.logPipelineStatus('⚠️ FALLBACK_SEQUENTIAL', 'Using sequential fallback processing');
            }

            // Phase 4: Smart Document Selection (Skip redundant grading after reranking)
            this.logPipelineStatus('📋 PHASE_4', 'Smart document selection...');

            let relevantDocuments: any[];

            const hasHighQualityReranking = rerankedResults.length > 0 &&
                rerankedResults.some((r: any) => r.relevanceScore > 0.7);

            if (hasHighQualityReranking) {
                relevantDocuments = rerankedResults.filter((r: any) => r.relevanceScore > 0.5);
                this.logPipelineStatus('📋 SMART_SELECTION', `${strategyName}: ${relevantDocuments.length} high-quality documents (grading skipped)`);
            } else {
                // Fallback to grading for low-quality results
                try {
                    const gradingResult = await this.documentGradingService.gradeAndFilterDocuments(
                        context.query,
                        rerankedResults,
                        context.complexityAnalysis
                    );
                    relevantDocuments = gradingResult.relevantDocuments;
                    this.logPipelineStatus('📋 GRADING_COMPLETE', `${strategyName}: ${relevantDocuments.length} relevant documents`);
                } catch (gradingError) {
                    relevantDocuments = rerankedResults;
                    this.logPipelineStatus('📋 GRADING_BYPASSED', `${strategyName}: Using all ${relevantDocuments.length} results (grading bypassed)`);
                }
            }


            this.logPipelineStatus('🤖 PHASE_5', 'Generating AI response...');

            try {
                const response = await this.responseGenerationService.generateAnswer(
                    compressedContext.content,
                    context.messages,
                    context.query,
                    context.signal,
                    context.chatSessionId,
                    context.metadataTracker,
                    context.queryExtraction?.pageNumbers
                );

                this.logPipelineStatus('✅ RESPONSE_GENERATION_COMPLETE', `${strategyName}: Generated response`);

                return response;
            } catch (responseError) {
                this.logPipelineStatus('❌ RESPONSE_GENERATION_FAILED', `${strategyName}: ${responseError instanceof Error ? responseError.message : 'Unknown error'}`);

                // Return fallback response
                return await this.responseGenerationService.generateAnswer(
                    '', // Empty context triggers fallback
                    context.messages,
                    context.query,
                    context.signal,
                    context.chatSessionId,
                    context.metadataTracker
                );
            }

        } catch (error) {
            this.logPipelineStatus('❌ SHARED_PROCESSING_FAILED', `${strategyName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }


    private buildQueriesForStrategy(context: PipelineContext, strategy: SearchStrategy): string[] {
        const queries: string[] = [context.query];
        const maxQueries = this.getMaxQueriesForStrategy(strategy);

        const shouldUseRewrittenQueries = context.queryExtraction?.queryRewriting?.shouldRewrite &&
            context.queryExtraction?.queryRewriting?.rewrittenQueries?.length &&
            context.queryExtraction?.queryRewriting?.rewrittenQueries;

        if (shouldUseRewrittenQueries && context.queryExtraction?.queryRewriting?.rewrittenQueries) {
            const rewrittenQueries = context.queryExtraction.queryRewriting.rewrittenQueries
                .slice(0, maxQueries - 1)
                .filter((query): query is string => query !== undefined);
            queries.push(...rewrittenQueries);

            this.logPipelineStatus('🔄 QUERY_REWRITING', `Using ${rewrittenQueries.length} rewritten queries`);
        } else {
            this.logPipelineStatus('⚡ SINGLE_QUERY', 'Using original query only (optimized for speed)');
        }
        if (strategy === 'ExpandedSearch' &&
            context.queryExtraction?.queryRewriting?.hydeAnswer &&
            context.queryExtraction.queryRewriting.requiresHyde) {
            queries.push(context.queryExtraction.queryRewriting.hydeAnswer);
            this.logPipelineStatus('🧠 HYDE_QUERY', 'Added HyDE answer for expanded search');
        }

        // Deduplicate and validate
        const finalQueries = Array.from(new Set(queries.map(q => q.trim()).filter(Boolean)));

        this.logPipelineStatus('📊 FINAL_QUERIES', `Total queries: ${finalQueries.length}/${maxQueries} max`);
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
        const strategyEmoji = this.getStrategyEmoji(strategy);

        this.logPipelineStatus(`${strategyEmoji} VECTOR_SEARCH`, `Searching with ${searchQueries.length} queries`);

        const docIds = context.indexedDocuments.map(doc => doc.documentId);
        const allResults: SearchResult[] = [];
        const metadataFilter = this.buildMetadataFilter(context);

        const hasPageNumbers = context.queryExtraction?.pageNumbers && context.queryExtraction.pageNumbers.length > 0;
        const useMetadataFilter = hasPageNumbers && metadataFilter;

        if (metadataFilter && useMetadataFilter) {
            this.logPipelineStatus('🎯 METADATA_FILTER', `Using metadata filter: ${JSON.stringify(metadataFilter)}`);
        } else if (hasPageNumbers) {
            this.logPipelineStatus('📄 PAGE_QUERY_DETECTED', `Page numbers detected: ${context.queryExtraction?.pageNumbers?.join(', ')} - NO METADATA FILTER APPLIED`);
        } else {
            this.logPipelineStatus('⚠️ NO_PAGE_FILTER', 'No page-specific filtering applied');
        }

        try {
            if (context.metadataTracker) {
                context.metadataTracker.startSearch();
            }

            const searchPromises = searchQueries.map(async (query, index) => {
                try {
                    this.logPipelineStatus(`🔍 QUERY_${index + 1}`, `Searching: "${query}"`);

                    const results = await Promise.race([
                        this.documentSearchService.performVectorSearchInternal(
                            query,
                            context.dataroomId,
                            docIds,
                            context.signal,
                            { topK: config.topK, similarityThreshold: config.similarityThreshold },
                            useMetadataFilter ? metadataFilter || undefined : undefined
                        ),
                        new Promise<SearchResult[]>((_, reject) =>
                            setTimeout(() => reject(new Error(`Query timeout after ${config.timeoutMs}ms`)), config.timeoutMs)
                        )
                    ]);

                    this.logPipelineStatus(`✅ QUERY_${index + 1}`, `Found ${results.length} results`);
                    return results;
                } catch (error) {
                    return [];
                }
            });

            // Wait for all searches to complete
            const queryResults = await Promise.all(searchPromises);

            // Combine all results
            queryResults.forEach((results, index) => {
                allResults.push(...results);
                this.logPipelineStatus(`📊 QUERY_${index + 1}_RESULTS`, `Added ${results.length} results`);
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

            this.logPipelineStatus(`${strategyEmoji} SEARCH_COMPLETE`,
                `Combined ${allResults.length} results → ${uniqueResults.length} unique results`);

            return uniqueResults;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Get search configuration for strategy
     */
    private getSearchConfig(strategy: SearchStrategy): SearchConfig {
        switch (strategy) {
            case 'FastVectorSearch': return this.searchConfigs.FAST;
            case 'StandardVectorSearch': return this.searchConfigs.STANDARD;
            case 'ExpandedSearch': return this.searchConfigs.EXPANDED;
            case 'PageQueryStrategy': return this.searchConfigs.PAGE_QUERY;
            default: return this.searchConfigs.STANDARD;
        }
    }

    private getStrategyEmoji(strategy: SearchStrategy): string {
        switch (strategy) {
            case 'FastVectorSearch': return '⚡';
            case 'StandardVectorSearch': return '🔄';
            case 'ExpandedSearch': return '🚀';
            case 'PageQueryStrategy': return '📄';
            default: return '🔄';
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

            this.logPipelineStatus('📄 PAGE_FILTER', `Applied page filtering: ${filter.pageRanges.join(', ')}`);
        }

        return Object.keys(filter).length > 1 ? filter : null;
    }

    private generateCorrelationId(): string {
        return `rag_${crypto.randomUUID()}`;
    }

    private logPipelineStatus(stage: string, message: string, metrics?: { [key: string]: any }) {
        const timestamp = new Date().toISOString();
        const metricString = metrics ? ` | ${JSON.stringify(metrics)}` : '';
    }


    private getPipelineMetrics(startTime: number, queryCount: number, strategy: string) {
        const duration = Date.now() - startTime;
        return {
            duration,
            queryCount,
            strategy,
            queriesPerSecond: queryCount / (duration / 1000),
            timestamp: new Date().toISOString()
        };
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
        // Basic validation
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

        // Security validation
        this.validateSecurity(query, dataroomId, messages);
    }

    private validateSecurity(query: string, dataroomId: string, messages: UIMessage[]): void {
        // Query length validation
        if (query.length > 10000) {
            throw RAGError.create('validation', 'Query too long (max 10,000 characters)', {
                field: 'query',
                length: query.length,
                maxLength: 10000
            });
        }

        // Dataroom ID format validation
        if (!/^[a-zA-Z0-9_-]+$/.test(dataroomId)) {
            throw RAGError.create('validation', 'Invalid dataroom ID format', {
                field: 'dataroomId',
                value: dataroomId
            });
        }

        // Message content validation
        for (const message of messages) {
            const content = this.extractMessageContent(message);
            if (content && content.length > 50000) {
                throw RAGError.create('validation', 'Message content too long (max 50,000 characters)', {
                    field: 'messages',
                    messageIndex: messages.indexOf(message),
                    length: content.length,
                    maxLength: 50000
                });
            }
        }

        // Check for potential injection patterns
        const suspiciousPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /eval\s*\(/gi,
            /expression\s*\(/gi
        ];

        const allContent = query + ' ' + messages.map(m => this.extractMessageContent(m)).join(' ');
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(allContent)) {
                throw RAGError.create('validation', 'Potentially malicious content detected', {
                    field: 'content',
                    pattern: pattern.toString()
                });
            }
        }
    }

    private extractMessageContent(message: UIMessage): string {
        const messageAny = message as any;

        if (typeof messageAny.content === 'string') {
            return messageAny.content;
        }

        if (messageAny.parts && Array.isArray(messageAny.parts)) {
            return messageAny.parts
                .filter((part: any) => part.type === 'text' && typeof part.text === 'string')
                .map((part: any) => part.text)
                .join(' ');
        }

        return JSON.stringify(messageAny.content || '');
    }

    private isValidStrategy(strategy: string): strategy is SearchStrategy {
        return ['FastVectorSearch', 'StandardVectorSearch', 'ExpandedSearch', 'PageQueryStrategy'].includes(strategy);
    }

    dispose(): void {
        if (this.isDisposed) return;
        this.isDisposed = true;
    }
}

export const ragOrchestratorService = new RAGOrchestratorService();

