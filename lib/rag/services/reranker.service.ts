import { SearchResult, RerankerConfig, RerankerResult } from '../types/rag-types';
import { RAGError } from '../errors';
import { configurationManager } from '../config';


let pipeline: any = null;

export class RerankerService {
    private config: RerankerConfig;
    private isDisposed = false;
    private crossEncoder: any = null;
    private modelLoaded = false;
    private modelLoadingPromise: Promise<void> | null = null;
    private static instance: RerankerService | null = null;

    private constructor() {
        const ragConfig = configurationManager.getRAGConfig();
        this.config = {
            enabled: ragConfig.reranker.enabled,
            model: ragConfig.reranker.model,
            maxTokens: ragConfig.reranker.maxTokens,
            temperature: ragConfig.reranker.temperature,
            timeout: ragConfig.reranker.timeout,
            fallbackModel: ragConfig.reranker.fallbackModel
        };

        if (this.config.enabled) {
            this.modelLoadingPromise = this.initializeCrossEncoder();
        }
    }

    static getInstance(): RerankerService {
        if (!RerankerService.instance) {
            if (!RerankerService.instance) {
                RerankerService.instance = new RerankerService();
            }
        }
        return RerankerService.instance;
    }

    private async loadTransformers(): Promise<void> {
        if (!pipeline && typeof window === 'undefined') {
            const maxRetries = 3;
            let lastError: Error | null = null;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const transformers = await import('@xenova/transformers');
                    pipeline = transformers.pipeline;
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

            if (typeof window !== 'undefined' || !pipeline) {
                this.modelLoaded = false;
                return;
            }

            const modelName = this.getCrossEncoderModelName();
            const loadingPromise = pipeline(
                'text-classification',
                modelName,
                {
                    quantized: true,
                    progress_callback: (progress: any) => {
                        if (progress.status === 'downloading') {
                        }
                    }
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
        if (this.isDisposed) {
            throw RAGError.create('serviceDisposed', undefined, { service: 'RerankerService' });
        }

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

        // If model failed to load, use TF-IDF fallback
        if (!this.modelLoaded) {
            return this.fallbackToTFIDF(query, searchResults);
        }

        let results: RerankerResult[];
        try {
            results = await this.rerankWithModel(query, searchResults, this.config.model, signal);
        } catch (error) {
            if (this.config.fallbackModel) {
                try {
                    results = await this.rerankWithModel(query, searchResults, this.config.fallbackModel, signal);
                } catch (fallbackError) {
                    results = this.fallbackToTFIDF(query, searchResults);
                }
            } else {
                results = this.fallbackToTFIDF(query, searchResults);
            }
        }
        return results;
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
        const results: RerankerResult[] = [];

        for (let i = 0; i < searchResults.length; i += BATCH_SIZE) {
            if (signal?.aborted) {
                throw new Error('Reranking aborted during batch processing');
            }

            const batch = searchResults.slice(i, i + BATCH_SIZE);

            const batchPromises = batch.map(async (result, batchIndex) => {
                const originalIndex = i + batchIndex;
                try {
                    const score = await this.scorePair(query, result.content, model, signal);
                    return {
                        ...result,
                        relevanceScore: score,
                        confidence: 0.8,
                        rerankedRank: originalIndex
                    };
                } catch (error) {
                    return {
                        ...result,
                        relevanceScore: result.similarity,
                        confidence: 0.3,
                        rerankedRank: originalIndex
                    };
                }
            });

            const batchResults = await Promise.allSettled(batchPromises);

            batchResults.forEach((result, batchIndex) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    const originalIndex = i + batchIndex;
                    results.push({
                        ...searchResults[originalIndex],
                        relevanceScore: searchResults[originalIndex].similarity,
                        confidence: 0.1,
                        rerankedRank: originalIndex
                    });
                }
            });
        }

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

            return await this.scoreWithTFIDF(query, document, model);
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
            return await this.scoreWithTFIDF(query, document, 'default');
        }
    }

    private async scoreWithTFIDF(
        query: string,
        document: string,
        model: string
    ): Promise<number> {
        const queryTerms = this.normalizeText(query).filter(term => term.length > 2);
        const docTerms = this.normalizeText(document).filter(term => term.length > 2);

        if (queryTerms.length === 0 || docTerms.length === 0) {
            return 0;
        }

        const exactMatchScore = this.calculateExactMatchScore(queryTerms, docTerms);

        const positionScore = this.calculatePositionScore(query, document);

        const finalScore = Math.max(0, Math.min(1,
            exactMatchScore * 0.7 + positionScore * 0.3
        ));

        return finalScore;
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

        // Truncate and add ellipsis
        return text.substring(0, maxLength - 3) + '...';
    }

    private normalizeText(text: string): string[] {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Remove punctuation
            .split(/\s+/)
            .filter(term => term.length > 0);
    }

    private calculateExactMatchScore(queryTerms: string[], docTerms: string[]): number {
        const docTermSet = new Set(docTerms);
        const exactMatches = queryTerms.filter(term => docTermSet.has(term));
        return queryTerms.length > 0 ? exactMatches.length / queryTerms.length : 0;
    }


    private calculatePositionScore(query: string, document: string): number {
        const queryLower = query.toLowerCase();
        const docLower = document.toLowerCase();

        const firstOccurrence = docLower.indexOf(queryLower);
        if (firstOccurrence === -1) return 0;

        // Score decreases as position increases
        const maxScore = 1.0;
        const decayFactor = 0.1;
        const position = firstOccurrence / document.length;

        return maxScore * Math.exp(-decayFactor * position);
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
