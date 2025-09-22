import { RAGError } from './errors/rag-errors';
import { SearchResult } from './types/rag-types';
import { generateEmbedding } from './ai-sdk-integration';
import { vectorManager } from './vector-manager';
import { log } from '@/lib/utils';
import { configurationManager } from './config/configuration-manager';

let DEFAULT_SEARCH_CONFIG = {
    topK: 10,
    similarityThreshold: 0.3,
    embeddingTimeoutMs: 20000
};

export class VectorSearchService {

    constructor() {
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
        if (signal?.aborted) {
            throw new Error('Embedding generation aborted before start');
        }

        try {
            return await Promise.race([
                generateEmbedding(query),
                new Promise<never>((_, reject) => {
                    const timeoutId = setTimeout(() =>
                        reject(new Error(`Embedding generation timeout after ${DEFAULT_SEARCH_CONFIG.embeddingTimeoutMs}ms`)),
                        DEFAULT_SEARCH_CONFIG.embeddingTimeoutMs
                    );
                    if (signal) {
                        signal.addEventListener('abort', () => {
                            clearTimeout(timeoutId);
                            reject(new Error('Embedding generation aborted'));
                        });
                    }
                })
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
            const enrichedResults = searchResults.map((result) => {
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
                        documentName: payload.metadata?.documentName || '',
                        headerHierarchy: payload.metadata?.headerHierarchy || [],
                        isSmallChunk: payload.metadata?.isSmallChunk || false,
                        startLine: payload.metadata?.startLine || 0,
                        endLine: payload.metadata?.endLine || 0,
                        tokenCount: payload.metadata?.tokenCount || 0,
                        contentType: payload.metadata?.contentType || '',
                        dataroomId: payload.metadata?.dataroomId || '',
                        teamId: payload.metadata?.teamId || ''
                    }
                };
            });
            return enrichedResults;
        } catch (error) {
            log({
                message: `Failed to enrich with metadata, using basic results: ${error}`,
                type: "error",
            });
            return this.mapToSearchResults(searchResults);
        }
    }

    private mapToSearchResults(searchResults: any[]): SearchResult[] {
        const mappedResults = searchResults.map((result) => ({
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
        return mappedResults;
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
