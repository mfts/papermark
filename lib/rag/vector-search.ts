import { RAGError } from './errors';
import { SearchResult } from './types/rag-types';
import { generateEmbedding } from './ai-sdk-integration';
import { vectorManager } from './vector-manager';
import { VectorSearchCache } from './utils/lruCache';
import { log } from '@/lib/utils';
import { configurationManager } from './config';

let DEFAULT_SEARCH_CONFIG = {
    topK: 10,
    similarityThreshold: 0.3,
    embeddingTimeoutMs: 20000
};

export class VectorSearchService {
    private vectorSearchCache: VectorSearchCache;

    constructor() {
        this.vectorSearchCache = new VectorSearchCache();
        const ragConfig = configurationManager.getRAGConfig();
        DEFAULT_SEARCH_CONFIG.topK = ragConfig.vectorSearch.defaultTopK;
        DEFAULT_SEARCH_CONFIG.similarityThreshold = ragConfig.vectorSearch.defaultSimilarityThreshold;
        DEFAULT_SEARCH_CONFIG.embeddingTimeoutMs = ragConfig.vectorSearch.embeddingTimeout;
    }

    async searchSimilarChunks(
        query: string,
        dataroomId: string,
        documentIds: string[],
        options: {
            topK?: number;
            similarityThreshold?: number;
            metadataFilter?: {
                documentIds?: string[];
                pageRanges?: string[];
                dataroomId?: string;
            };
        } = {},
        signal?: AbortSignal,
        includeMetadata: boolean = true
    ): Promise<SearchResult[]> {
        return RAGError.withErrorHandling(
            async () => {
                this.validateSearchInputs(query, dataroomId, documentIds);

                const {
                    topK = DEFAULT_SEARCH_CONFIG.topK,
                    similarityThreshold = DEFAULT_SEARCH_CONFIG.similarityThreshold,
                    metadataFilter
                } = options;

                const cacheKey = this.generateVectorSearchKey(
                    query,
                    dataroomId,
                    documentIds,
                    { topK, similarityThreshold, includeMetadata, metadataFilter }
                );

                const cachedResults = await this.vectorSearchCache.get(cacheKey);
                if (cachedResults) {
                    console.log(`🎯 Cache hit for vector search: ${cacheKey}`);
                    return cachedResults;
                }

                console.log(`🔍 Cache miss for vector search: ${cacheKey}`);
                const queryEmbedding = await this.generateEmbeddingWithTimeout(query, signal);
                if (!queryEmbedding) {
                    log({
                        message: "Failed to generate query embedding",
                        type: "error",
                    });
                    return [];
                }

                const finalMetadataFilter = metadataFilter;

                const searchResults = await vectorManager.searchSimilar(
                    dataroomId,
                    queryEmbedding.embedding,
                    topK,
                    similarityThreshold,
                    finalMetadataFilter
                );
                if (searchResults.length === 0) {
                    return [];
                }

                const enrichedResults = includeMetadata
                    ? await this.enrichWithMetadata(searchResults)
                    : this.mapToSearchResults(searchResults);

                await this.vectorSearchCache.set(cacheKey, enrichedResults);

                return enrichedResults;
            },
            'vectorSearch',
            { service: 'VectorSearch', operation: 'searchSimilarChunks', dataroomId, query }
        );
    }


    private validateSearchInputs(query: string, dataroomId: string, documentIds: string[]): void {
        if (!query || query.trim().length === 0) {
            throw RAGError.create('validation', 'Query cannot be empty', { field: 'query' });
        }
        if (!dataroomId || dataroomId.trim().length === 0) {
            throw RAGError.create('validation', 'Dataroom ID cannot be empty', { field: 'dataroomId' });
        }
        if (!documentIds || documentIds.length === 0) {
            throw RAGError.create('validation', 'Document IDs cannot be empty', { field: 'documentIds' });
        }
    }


    private async generateEmbeddingWithTimeout(query: string, signal?: AbortSignal) {
        try {
            return await Promise.race([
                generateEmbedding(query),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error(`Embedding generation timeout after ${DEFAULT_SEARCH_CONFIG.embeddingTimeoutMs}ms`)),
                        DEFAULT_SEARCH_CONFIG.embeddingTimeoutMs)
                )
            ]);
        } catch (error) {
            if (signal?.aborted) {
                throw new Error('Embedding generation aborted');
            }
            throw error;
        }
    }


    private async enrichWithMetadata(
        searchResults: any[]
    ): Promise<SearchResult[]> {
        try {
            // All metadata is already available in Qdrant payload
            return searchResults.map((result) => {
                const payload = result.payload;


                return {
                    chunkId: result.id,
                    documentId: payload.documentId,
                    content: payload.content,
                    similarity: result.score,
                    metadata: {
                        pageRanges: payload.metadata?.pageRanges || ['1'],
                        sectionHeader: payload.metadata?.sectionHeader || '',
                        chunkIndex: payload.metadata?.chunkIndex || 0,
                        documentName: payload.metadata?.documentName || ''
                    }
                };
            });

        } catch (error) {
            log({
                message: `Failed to enrich with metadata, using basic results: ${error}`,
                type: "error",
            });
            return this.mapToSearchResults(searchResults);
        }
    }

    private mapToSearchResults(searchResults: any[]): SearchResult[] {
        return searchResults.map((result) => ({
            chunkId: result.id,
            documentId: result.payload.documentId,
            content: result.payload.content,
            similarity: result.score,
            metadata: {
                pageRanges: ['1'],
                sectionHeader: '',
                chunkIndex: 0,
                documentName: ''
            }
        }));
    }

    private generateVectorSearchKey(query: string, dataroomId: string, documentIds: string[], options: any): string {
        const optionsHash = JSON.stringify(options);
        const docIdsHash = documentIds.sort().join(',');
        return `vector_search:${dataroomId}:${query}:${docIdsHash}:${optionsHash}`;
    }


    async healthCheck(): Promise<boolean> {
        return RAGError.withErrorHandling(
            async () => {
                return await vectorManager.healthCheck();
            },
            'database',
            { service: 'VectorSearch', operation: 'healthCheck' }
        );
    }
}

export const vectorSearchService = new VectorSearchService();
