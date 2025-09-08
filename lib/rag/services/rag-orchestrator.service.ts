
import { RAGError } from '../errors';
import { AccessibleDocument } from '../document-permissions';
import { SearchResult } from '../types/rag-types';
import { UIMessage } from 'ai';
import { ResponseGenerationService, responseGenerationService } from './response-generation.service';
import { SourceBuildingService, sourceBuildingService } from './source-building.service';
import { rerankerService } from './reranker.service';
import { contextCompressionService } from './context-compression.service';
import { QueryAnalysisService, queryAnalysisService } from './query-analysis.service';
import { DocumentSearchService, documentSearchService } from './document-search.service';
import { DocumentGradingService, documentGradingService } from './document-grading.service';
import { UnifiedQueryAnalysisResult } from './unified-query-analysis.service';
import { configurationManager } from '../config';
import { ChatMetadataTracker } from './chat-metadata-tracker.service';


const PIPELINE_LIMITS = {
    MAX_STANDARD_QUERIES: 15,
    MAX_EXPANDED_QUERIES: 20,
    MAX_FAST_QUERIES: 3
} as const;

let SEARCH_CONFIGS: {
    FAST: { topK: number; similarityThreshold: number; timeoutMs: number };
    STANDARD: { topK: number; similarityThreshold: number; timeoutMs: number };
    EXPANDED: { topK: number; similarityThreshold: number; timeoutMs: number };
};

function initializeSearchConfigs() {
    const ragConfig = configurationManager.getRAGConfig();
    SEARCH_CONFIGS = {
        FAST: {
            topK: ragConfig.search.fastTopK,
            similarityThreshold: ragConfig.search.fastSimilarityThreshold,
            timeoutMs: 45000 // 45 seconds for fast search
        },
        STANDARD: {
            topK: ragConfig.search.standardTopK,
            similarityThreshold: ragConfig.search.standardSimilarityThreshold,
            timeoutMs: 50000 // 50 seconds for standard search
        },
        EXPANDED: {
            topK: ragConfig.search.expandedTopK,
            similarityThreshold: ragConfig.search.expandedSimilarityThreshold,
            timeoutMs: 55000 // 55 seconds for expanded search
        }
    };
}

// Initialize on module load
initializeSearchConfigs();

export type SearchStrategy = 'FastVectorSearch' | 'StandardVectorSearch' | 'ExpandedSearch';

interface ComplexityAnalysis {
    complexityScore: number;
    complexityLevel: 'low' | 'medium' | 'high';
    wordCount: number;
}



interface QueryExtraction {
    pageNumbers: number[];
    keywords: string[];
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
    private queryAnalysisService: QueryAnalysisService;
    private documentSearchService: DocumentSearchService;
    private documentGradingService: DocumentGradingService;
    private responseGenerationService: ResponseGenerationService;
    private sourceBuildingService: SourceBuildingService;
    private isDisposed = false;

    constructor(
        customQueryAnalysisService?: QueryAnalysisService,
        customDocumentSearchService?: DocumentSearchService,
        customDocumentGradingService?: DocumentGradingService,
        customResponseGenerationService?: ResponseGenerationService,
        customSourceBuildingService?: SourceBuildingService
    ) {
        this.queryAnalysisService = customQueryAnalysisService || queryAnalysisService;
        this.documentSearchService = customDocumentSearchService || documentSearchService;
        this.documentGradingService = customDocumentGradingService || documentGradingService;
        this.responseGenerationService = customResponseGenerationService || responseGenerationService;
        this.sourceBuildingService = customSourceBuildingService || sourceBuildingService;
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
        // Chat storage parameters
        chatSessionId?: string,
        metadataTracker?: ChatMetadataTracker
    ) {
        return RAGError.withErrorHandling(
            async () => {
                if (this.isDisposed) {
                    throw RAGError.create('serviceDisposed', undefined, { service: 'RAGOrchestratorService' });
                }

                const correlationId = this.generateCorrelationId();
                const startTime = Date.now();

                // Initialize metadata tracking
                if (metadataTracker) {
                    metadataTracker.startTotal();
                    metadataTracker.setQueryAnalysis({
                        queryType: 'document_question', // Default, will be updated by analysis
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
                        // Note: result is a Response object, not a data object with sources
                        // Sources are handled in the text generation service
                    }

                    return result;

                } catch (error) {
                    console.error(`❌ RAG Pipeline failed [${correlationId}]:`, error);

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
                        return await this.responseGenerationService.createFallbackResponse(
                            "The request took too long to process. Please try a simpler query or try again later."
                        );
                    }

                    this.logPipelineStatus('❌ FAILED', `${error instanceof Error ? error.message : 'Unknown error'}`);

                    return await this.responseGenerationService.createFallbackResponse(query);
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
                return await this.responseGenerationService.createFallbackResponse(context.query);
            }

            return await this.executeSharedProcessingPipeline(context, searchResults, 'FastVectorSearch');

        } catch (error) {
            console.error('❌ FastVectorSearch failed:', error);
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
                return await this.responseGenerationService.createFallbackResponse(context.query);
            }

            return await this.executeSharedProcessingPipeline(context, searchResults, 'StandardVectorSearch');

        } catch (error) {
            console.error('❌ StandardVectorSearch failed:', error);
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
                return await this.responseGenerationService.createFallbackResponse(context.query);
            }

            return await this.executeSharedProcessingPipeline(context, searchResults, 'ExpandedSearch');

        } catch (error) {
            console.error('❌ ExpandedSearch failed:', error);
            this.logPipelineStatus('❌ EXPANDED_PIPELINE_FAILED', `${error instanceof Error ? error.message : 'Unknown error'}`);
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
                const gradedDocuments = searchResults.map(result => ({
                    documentId: result.documentId,
                    chunkId: result.chunkId,
                    relevanceScore: result.similarity || 0.8,
                    confidence: 0.8,
                    reasoning: 'Fast path optimization',
                    isRelevant: true,
                    suggestedWeight: 0.8,
                    originalContent: result.content,
                    metadata: result.metadata
                }));

                const sources = await this.sourceBuildingService.buildSources(gradedDocuments, searchResults, context.indexedDocuments);
                const contextText = searchResults.map(r => r.content).join('\n\n');

                const response = await this.responseGenerationService.generateAnswer(
                    contextText,
                    context.messages,
                    context.query,
                    sources,
                    context.signal,
                    context.chatSessionId,
                    context.metadataTracker
                );

                this.logPipelineStatus('✅ FAST_RESPONSE_COMPLETE', `Generated fast response with ${sources.length} sources`);
                return response;
            }


            this.logPipelineStatus('⚙️ PHASE_3', 'Reranking and context compression...');

            let rerankedResults: any[];
            let compressedContext: any;

            try {
                [rerankedResults, compressedContext] = await Promise.all([
                    rerankerService.rerankResults(context.query, searchResults, context.signal),
                    contextCompressionService.compressContext(searchResults, context.query, context.signal, context.complexityAnalysis)
                ]);

                this.logPipelineStatus('⚙️ RERANKING_COMPRESSION_COMPLETE', `${strategyName}: Reranked ${rerankedResults.length} results`);
            } catch (compressionError) {
                console.warn('⚠️ Context compression failed, using uncompressed results:', compressionError);
                this.logPipelineStatus('⚠️ COMPRESSION_FAILED', 'Using uncompressed context due to compression error');

                // Fallback to uncompressed context
                rerankedResults = await rerankerService.rerankResults(context.query, searchResults, context.signal);
                compressedContext = { content: searchResults.map(r => r.content).join('\n\n') };

                this.logPipelineStatus('⚙️ RERANKING_COMPLETE', `${strategyName}: Reranked ${rerankedResults.length} results (compression bypassed)`);
            }

            // Phase 4: Document Grading
            this.logPipelineStatus('📋 PHASE_4', 'Grading document relevance...');

            let relevantDocuments: any[];
            try {
                const gradingResult = await this.documentGradingService.gradeAndFilterDocuments(
                    context.query,
                    rerankedResults,
                    context.complexityAnalysis
                );
                relevantDocuments = gradingResult.relevantDocuments;
                this.logPipelineStatus('📋 GRADING_COMPLETE', `${strategyName}: ${relevantDocuments.length} relevant documents`);
            } catch (gradingError) {
                console.warn('⚠️ Document grading failed, using all results:', gradingError);
                this.logPipelineStatus('⚠️ GRADING_FAILED', 'Using all results due to grading error');


                relevantDocuments = rerankedResults;
                this.logPipelineStatus('📋 GRADING_BYPASSED', `${strategyName}: Using all ${relevantDocuments.length} results (grading bypassed)`);
            }

            this.logPipelineStatus('🏗️ BUILDING_SOURCES', 'Building source references...');
            const sources = await this.sourceBuildingService.buildSources(relevantDocuments, rerankedResults, context.indexedDocuments);

            this.logPipelineStatus('🤖 PHASE_5', 'Generating AI response...');

            try {
                const response = await this.responseGenerationService.generateAnswer(
                    compressedContext.content,
                    context.messages,
                    context.query,
                    sources,
                    context.signal,
                    context.chatSessionId,
                    context.metadataTracker
                );

                this.logPipelineStatus('✅ RESPONSE_GENERATION_COMPLETE', `${strategyName}: Generated response with ${sources.length} sources`);

                return response;
            } catch (responseError) {
                console.error('❌ Response generation failed:', responseError);
                this.logPipelineStatus('❌ RESPONSE_GENERATION_FAILED', `${strategyName}: ${responseError instanceof Error ? responseError.message : 'Unknown error'}`);

                // Return fallback response
                return await this.responseGenerationService.createFallbackResponse(context.query);
            }

        } catch (error) {
            console.error(`❌ ${strategyName} shared processing failed:`, error);
            this.logPipelineStatus('❌ SHARED_PROCESSING_FAILED', `${strategyName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }


    private buildQueriesForStrategy(context: PipelineContext, strategy: SearchStrategy): string[] {
        const queries: string[] = [context.query];
        const maxQueries = this.getMaxQueriesForStrategy(strategy);


        if (context.queryExtraction?.queryRewriting?.rewrittenQueries?.length) {
            const rewrittenQueries = context.queryExtraction.queryRewriting.rewrittenQueries
                .slice(0, maxQueries - 1) // Reserve 1 slot for original query
                .filter((query): query is string => query !== undefined);
            queries.push(...rewrittenQueries);
        }


        if (strategy === 'ExpandedSearch' &&
            context.queryExtraction?.queryRewriting?.hydeAnswer &&
            context.queryExtraction.queryRewriting.requiresHyde) {
            queries.push(context.queryExtraction.queryRewriting.hydeAnswer);
        }

        // Deduplicate and validate
        return Array.from(new Set(queries.map(q => q.trim()).filter(Boolean)));
    }


    private getMaxQueriesForStrategy(strategy: SearchStrategy): number {
        switch (strategy) {
            case 'FastVectorSearch': return PIPELINE_LIMITS.MAX_FAST_QUERIES;
            case 'StandardVectorSearch': return PIPELINE_LIMITS.MAX_STANDARD_QUERIES;
            case 'ExpandedSearch': return PIPELINE_LIMITS.MAX_EXPANDED_QUERIES;
            default: return PIPELINE_LIMITS.MAX_STANDARD_QUERIES;
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

        const useMetadataFilter = false;
        if (metadataFilter && useMetadataFilter) {
            this.logPipelineStatus('🎯 METADATA_FILTER', `Using metadata filter: ${JSON.stringify(metadataFilter)}`);
        } else {
            this.logPipelineStatus('⚠️ METADATA_FILTER_DISABLED', 'Metadata filtering temporarily disabled for debugging');
        }

        try {

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
                    console.error(`❌ Query ${index + 1} failed:`, error);
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

            // Remove duplicates based on chunkId
            const uniqueResults = this.removeDuplicateResults(allResults);

            this.logPipelineStatus(`${strategyEmoji} SEARCH_COMPLETE`,
                `Combined ${allResults.length} results → ${uniqueResults.length} unique results`);

            return uniqueResults;

        } catch (error) {
            console.error(`❌ ${strategy} search failed:`, error);
            throw error;
        }
    }

    /**
     * Get search configuration for strategy
     */
    private getSearchConfig(strategy: SearchStrategy) {
        switch (strategy) {
            case 'FastVectorSearch': return SEARCH_CONFIGS.FAST;
            case 'StandardVectorSearch': return SEARCH_CONFIGS.STANDARD;
            case 'ExpandedSearch': return SEARCH_CONFIGS.EXPANDED;
            default: return SEARCH_CONFIGS.STANDARD;
        }
    }

    private getStrategyEmoji(strategy: SearchStrategy): string {
        switch (strategy) {
            case 'FastVectorSearch': return '⚡';
            case 'StandardVectorSearch': return '🔄';
            case 'ExpandedSearch': return '🚀';
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

    /**
     * Build metadata filter from query extraction for cleaner vector search
     */
    private buildMetadataFilter(context: PipelineContext): {
        documentIds?: string[];
        pageRanges?: string[];
        dataroomId?: string;
    } | null {
        const filter: any = {};

        // Add dataroom ID
        filter.dataroomId = context.dataroomId;

        // Add document IDs if available
        if (context.indexedDocuments && context.indexedDocuments.length > 0) {
            filter.documentIds = context.indexedDocuments.map(doc => doc.documentId);
        }

        // Add page ranges if available from query extraction
        if (context.queryExtraction?.pageNumbers && context.queryExtraction.pageNumbers.length > 0) {
            filter.pageRanges = context.queryExtraction.pageNumbers.map(page => page.toString());
        }

        // Only return filter if we have meaningful conditions
        return Object.keys(filter).length > 1 ? filter : null;
    }

    /**
     * Build context and sources from search results
     */
    private async buildContextAndSources(searchResults: SearchResult[], reasoning: string, indexedDocuments: AccessibleDocument[]) {
        const context = searchResults.map(r => r.content).join('\n\n');
        const sourceData = searchResults.map(r => ({
            documentId: r.documentId,
            chunkId: r.chunkId,
            relevanceScore: r.similarity || 0,
            confidence: 0.8,
            reasoning,
            isRelevant: true,
            suggestedWeight: 0.8,
            originalContent: r.content,
            metadata: r.metadata
        }));

        const sources = await this.sourceBuildingService.buildSources(sourceData, searchResults, indexedDocuments);
        return { context, sources };
    }



    private generateCorrelationId(): string {
        return `rag_${crypto.randomUUID()}`;
    }

    private logPipelineStatus(stage: string, message: string, metrics?: { [key: string]: any }) {
        const timestamp = new Date().toISOString();
        const metricString = metrics ? ` | ${JSON.stringify(metrics)}` : '';
        console.log(`[${timestamp}] ${stage}: ${message}${metricString}`);
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


    dispose(): void {
        if (this.isDisposed) return;
        this.isDisposed = true;
    }
}

export const ragOrchestratorService = new RAGOrchestratorService();

