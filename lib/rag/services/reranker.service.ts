import { SearchResult, RerankerConfig, RerankerResult } from '../types/rag-types';
import { RAGError } from '../errors/rag-errors';
import { configurationManager } from '../config/configuration-manager';
import pLimit from 'p-limit';

export class RerankerService {
    private config: RerankerConfig;
    private crossEncoder: any = null;
    private modelLoaded = false;
    private modelLoadingPromise: Promise<void> | null = null;
    private static instance: RerankerService | null = null;
    private static pipeline: any = null;

    private constructor() {
        const ragConfig = configurationManager.getRAGConfig();
        this.config = {
            enabled: ragConfig.reranker.enabled,
            model: ragConfig.reranker.model,
            maxTokens: ragConfig.reranker.maxTokens,
            timeout: ragConfig.reranker.timeout,
            fallbackModel: ragConfig.reranker.fallbackModel
        };

        if (this.config.enabled) {
            this.modelLoadingPromise = this.initializeCrossEncoder();
        }
    }

    static getInstance(): RerankerService {
        if (!RerankerService.instance) {
            RerankerService.instance = new RerankerService();
        }
        return RerankerService.instance;
    }

    private async loadTransformers(): Promise<void> {
        if (!RerankerService.pipeline && typeof window === 'undefined') {
            const maxRetries = 3;
            let lastError: Error | null = null;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const transformers = await import('@xenova/transformers');
                    RerankerService.pipeline = transformers.pipeline;
                    return;
                } catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));

                    if (attempt < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                    }
                }
            }
            throw new Error(`Transformers library not available after ${maxRetries} attempts: ${lastError?.message}`);
        }
    }

    private async initializeCrossEncoder(): Promise<void> {
        try {
            await this.loadTransformers();

            if (typeof window !== 'undefined' || !RerankerService.pipeline) {
                this.modelLoaded = false;
                return;
            }

            const modelName = this.getCrossEncoderModelName();
            const loadingPromise = RerankerService.pipeline(
                'text-classification',
                modelName,
                {
                    quantized: true
                }
            );

            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Model loading timeout')), this.config.timeout)
            );

            this.crossEncoder = await Promise.race([loadingPromise, timeoutPromise]);
            this.modelLoaded = true;
        } catch (error) {
            this.modelLoaded = false;
        }
    }

    private getCrossEncoderModelName(): string {
        const modelMapping: Record<string, string> = {
            'bge-reranker-large': 'Xenova/bge-reranker-large',
            'bge-reranker-base': 'Xenova/bge-reranker-base',
            'default': 'Xenova/bge-reranker-base'
        };

        return modelMapping[this.config.model] || modelMapping.default;
    }

    private async ensureModelReady(): Promise<void> {
        if (this.modelLoadingPromise && !this.modelLoaded) {
            try {
                await this.modelLoadingPromise;
            } catch (error) {
                this.modelLoaded = false;
            }
        }
    }

    async rerankResults(
        query: string,
        searchResults: SearchResult[],
        signal?: AbortSignal
    ): Promise<RerankerResult[]> {
        this.validateInputs(query, searchResults);

        if (searchResults.length === 0) {
            return [];
        }

        if (!this.config.enabled) {
            return searchResults.map((result, index) => ({
                ...result,
                relevanceScore: result.similarity,
                confidence: 0.5,
                rerankedRank: index
            }));
        }

        await this.ensureModelReady();

        if (!this.modelLoaded) {
            return this.fallbackToTFIDF(query, searchResults);
        }

        try {
            return await this.rerankWithModel(query, searchResults, this.config.model, signal);
        } catch (error) {
            if (this.config.fallbackModel) {
                try {
                    return await this.rerankWithModel(query, searchResults, this.config.fallbackModel, signal);
                } catch (fallbackError) {
                    return this.fallbackToTFIDF(query, searchResults);
                }
            }
            return this.fallbackToTFIDF(query, searchResults);
        }
    }

    private async rerankWithModel(
        query: string,
        searchResults: SearchResult[],
        model: string,
        signal?: AbortSignal
    ): Promise<RerankerResult[]> {
        if (signal?.aborted) {
            throw new Error('Reranking aborted');
        }

        const BATCH_SIZE = Math.min(10, searchResults.length);
        const MAX_CONCURRENT_BATCHES = 3;
        const limit = pLimit(MAX_CONCURRENT_BATCHES);


        const batches: SearchResult[][] = [];
        for (let i = 0; i < searchResults.length; i += BATCH_SIZE) {
            batches.push(searchResults.slice(i, i + BATCH_SIZE));
        }

        const batchPromises = batches.map((batch, batchIndex) =>
            limit(async () => {
                if (signal?.aborted) {
                    throw new Error('Reranking aborted during batch processing');
                }

                const startIndex = batchIndex * BATCH_SIZE;
                const batchResults = await Promise.allSettled(
                    batch.map(async (result, index) => {
                        if (signal?.aborted) {
                            throw new Error('Reranking aborted during individual scoring');
                        }

                        const originalIndex = startIndex + index;
                        try {
                            const score = await this.scorePair(query, result.content, model, signal);
                            return {
                                ...result,
                                relevanceScore: score,
                                confidence: Math.min(0.9, Math.max(0.1, score)),
                                rerankedRank: originalIndex
                            };
                        } catch (error) {
                            return {
                                ...result,
                                relevanceScore: result.similarity,
                                confidence: 0.1,
                                rerankedRank: originalIndex
                            };
                        }
                    })
                );

                return batchResults.map((result, index) => {
                    if (result.status === 'fulfilled') {
                        return result.value;
                    } else {
                        const originalIndex = startIndex + index;
                        const originalResult = searchResults[originalIndex];
                        if (originalResult) {
                            return {
                                ...originalResult,
                                relevanceScore: originalResult.similarity,
                                confidence: 0.1,
                                rerankedRank: originalIndex
                            };
                        }
                        return null;
                    }
                }).filter(Boolean) as RerankerResult[];
            })
        );

        const allBatchResults = await Promise.allSettled(batchPromises);
        const results: RerankerResult[] = [];

        allBatchResults.forEach((batchResult) => {
            if (batchResult.status === 'fulfilled') {
                results.push(...batchResult.value);
            }
        });

        return results
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .map((result, index) => ({ ...result, rerankedRank: index }));
    }

    private async scorePair(
        query: string,
        document: string,
        model: string,
        signal?: AbortSignal
    ): Promise<number> {
        try {
            if (this.modelLoaded && this.crossEncoder) {
                return await this.scoreWithCrossEncoder(query, document, signal);
            }
            return this.calculateSimpleScore(query, document);
        } catch (error) {
            return this.calculateSimpleScore(query, document);
        }
    }

    private async scoreWithCrossEncoder(
        query: string,
        document: string,
        signal?: AbortSignal
    ): Promise<number> {
        try {
            const input = `${query} [SEP] ${document}`;

            const truncatedInput = this.truncateText(input, this.config.maxTokens - 10);

            const scoringPromise = this.crossEncoder(truncatedInput);
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Scoring timeout')), 5000)
            );

            const result = await Promise.race([scoringPromise, timeoutPromise]);
            const score = this.extractRelevanceScore(result);

            return Math.max(0, Math.min(1, score));
        } catch (error) {
            return this.calculateSimpleScore(query, document);
        }
    }


    private extractRelevanceScore(result: any): number {
        if (Array.isArray(result)) {
            const positiveClass = result.find((item: any) =>
                item.label === 'LABEL_1' ||
                item.label === 'POSITIVE' ||
                item.label === 'RELEVANT'
            );

            if (positiveClass) {
                return positiveClass.score;
            }

            return Math.max(...result.map((item: any) => item.score));
        }

        if (result.score !== undefined) {
            return result.score;
        }

        // Fallback
        return 0.5;
    }


    private truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + '...';
    }

    private normalizeText(text: string): string[] {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ') 
            .split(/\s+/)
            .filter(term => term.length > 0);
    }

    /**
     * Fallback to TF-IDF scoring when models fail
     */
    private fallbackToTFIDF(query: string, searchResults: SearchResult[]): RerankerResult[] {
        return searchResults.map((result, index) => {
            const score = this.calculateSimpleScore(query, result.content);
            return {
                ...result,
                relevanceScore: score,
                confidence: 0.4,
                rerankedRank: index
            };
        }).sort((a, b) => b.relevanceScore - a.relevanceScore)
            .map((result, index) => ({ ...result, rerankedRank: index }));
    }

    private calculateSimpleScore(query: string, document: string): number {
        const queryTerms = this.normalizeText(query);
        const docTerms = this.normalizeText(document);

        if (queryTerms.length === 0 || docTerms.length === 0) return 0;

        const docTermSet = new Set(docTerms);
        const matches = queryTerms.filter(term => docTermSet.has(term));
        const matchRatio = matches.length / queryTerms.length;

        return Math.min(matchRatio * 1.2, 1.0);
    }


    private validateInputs(query: string, searchResults: SearchResult[]): void {
        if (!query?.trim()) {
            throw RAGError.create('validation', 'Query is required for reranking', {
                service: 'RerankerService',
                field: 'query'
            });
        }
        if (!Array.isArray(searchResults)) {
            throw RAGError.create('validation', 'Search results must be an array', {
                service: 'RerankerService',
                field: 'searchResults'
            });
        }
    }


}

export const rerankerService = RerankerService.getInstance();
