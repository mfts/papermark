import { SearchResult } from '../types/rag-types';
import { vectorSearchService } from '../vector-search';
import { RAGError } from '../errors/rag-errors';
import { configurationManager } from '../config/configuration-manager';

interface SearchConfig {
    topK: number;
    similarityThreshold: number;
    maxResults: number;
}

export class DocumentSearchService {
    private vectorSearchService = vectorSearchService;
    private searchConfig: SearchConfig;

    constructor() {
        const ragConfig = configurationManager.getRAGConfig();
        this.searchConfig = {
            topK: ragConfig.search.standardTopK,
            similarityThreshold: ragConfig.search.standardSimilarityThreshold,
            maxResults: 12
        };
    }



    async performVectorSearchInternal(
        query: string,
        dataroomId: string,
        viewableDocumentIds: string[],
        signal?: AbortSignal,
        fastConfig?: {
            topK: number;
            similarityThreshold: number;
        },
        metadataFilter?: {
            documentIds?: string[];
            pageRanges?: string[];
            dataroomId?: string;
        }
    ): Promise<SearchResult[]> {
        return RAGError.withErrorHandling(
            async () => {
                // Input validation
                this.validateSearchInputs(query, dataroomId, viewableDocumentIds);

                const config = fastConfig || {
                    topK: this.searchConfig.topK * 2,
                    similarityThreshold: this.searchConfig.similarityThreshold
                };

                // Validate config parameters
                this.validateSearchConfig(config);

                return await this.vectorSearchService.searchSimilarChunks(
                    query,
                    dataroomId,
                    viewableDocumentIds,
                    {
                        topK: config.topK,
                        similarityThreshold: config.similarityThreshold,
                        metadataFilter
                    },
                    signal
                );
            },
            'vectorSearch',
            { service: 'DocumentSearch', operation: 'performVectorSearchInternal' }
        );
    }

    /**
     * Validate search input parameters
     */
    private validateSearchInputs(query: string, dataroomId: string, viewableDocumentIds: string[]): void {
        if (!query || query.trim().length === 0) {
            throw RAGError.create('validation', 'Query cannot be empty', { field: 'query' });
        }
        if (!dataroomId || dataroomId.trim().length === 0) {
            throw RAGError.create('validation', 'Dataroom ID cannot be empty', { field: 'dataroomId' });
        }
        if (!viewableDocumentIds || viewableDocumentIds.length === 0) {
            throw RAGError.create('validation', 'Viewable document IDs cannot be empty', { field: 'viewableDocumentIds' });
        }
    }

    /**
     * Validate search configuration parameters
     */
    private validateSearchConfig(config: { topK: number; similarityThreshold: number }): void {
        if (config.topK <= 0) {
            throw RAGError.create('validation', 'topK must be positive', { field: 'topK', value: config.topK });
        }
        if (config.similarityThreshold < 0 || config.similarityThreshold > 1) {
            throw RAGError.create('validation', 'similarityThreshold must be between 0 and 1', {
                field: 'similarityThreshold',
                value: config.similarityThreshold
            });
        }
    }


    async updateSearchConfig(config: Partial<SearchConfig>): Promise<void> {
        return RAGError.withErrorHandling(
            async () => {

                if (config.topK !== undefined && config.topK <= 0) {
                    throw RAGError.create('validation', 'topK must be positive', { field: 'topK', value: config.topK });
                }
                if (config.similarityThreshold !== undefined && (config.similarityThreshold < 0 || config.similarityThreshold > 1)) {
                    throw RAGError.create('validation', 'similarityThreshold must be between 0 and 1', {
                        field: 'similarityThreshold',
                        value: config.similarityThreshold
                    });
                }
                if (config.maxResults !== undefined && config.maxResults <= 0) {
                    throw RAGError.create('validation', 'maxResults must be positive', { field: 'maxResults', value: config.maxResults });
                }

                this.searchConfig = { ...this.searchConfig, ...config };
            },
            'validation',
            { service: 'DocumentSearch', operation: 'updateSearchConfig' }
        );
    }


    getSearchConfig(): SearchConfig {
        return { ...this.searchConfig };
    }
}

export const documentSearchService = new DocumentSearchService();
