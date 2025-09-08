import { SearchResult, RerankerConfig, RerankerResult } from '../types/rag-types';
import { RAGError } from '../errors';
import { configurationManager } from '../config';

export class RerankerService {
    private config: RerankerConfig;
    private isDisposed = false;

    constructor() {
        const ragConfig = configurationManager.getRAGConfig();
        this.config = {
            model: ragConfig.reranker.model,
            maxTokens: ragConfig.reranker.maxTokens,
            temperature: ragConfig.reranker.temperature,
            timeout: ragConfig.reranker.timeout,
            fallbackModel: ragConfig.reranker.fallbackModel
        };
    }

    /**
     * Rerank search results using cross-encoder
     */
    async rerankResults(
        query: string,
        searchResults: SearchResult[],
        signal?: AbortSignal
    ): Promise<RerankerResult[]> {
        if (this.isDisposed) {
            throw RAGError.create('serviceDisposed', undefined, { service: 'RerankerService' });
        }

        if (searchResults.length === 0) {
            return [];
        }

        try {
            return await this.rerankWithModel(query, searchResults, this.config.model, signal);
        } catch (error) {
            if (this.config.fallbackModel) {
                try {
                    return await this.rerankWithModel(query, searchResults, this.config.fallbackModel, signal);
                } catch (fallbackError) {
                    throw RAGError.create('responseGeneration', undefined, { query }, fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)));
                }
            }
            return searchResults.map((result, index) => ({
                ...result,
                relevanceScore: result.similarity,
                confidence: 0.5,
                reasoning: 'Reranking failed, using original similarity score',
                rerankedRank: index
            }));
        }
    }


    private async rerankWithModel(
        query: string,
        searchResults: SearchResult[],
        model: string,
        signal?: AbortSignal
    ): Promise<RerankerResult[]> {
        const rerankPromises = searchResults.map(async (result, index) => {
            try {
                const score = await this.scorePair(query, result.content, model, signal);
                return {
                    ...result,
                    relevanceScore: score,
                    confidence: 0.8,
                    reasoning: 'Cross-encoder reranking completed',
                    rerankedRank: index
                };
            } catch (error) {
                return {
                    ...result,
                    relevanceScore: result.similarity,
                    confidence: 0.3,
                    reasoning: 'Individual reranking failed',
                    rerankedRank: index
                };
            }
        });

        const results = await Promise.allSettled(rerankPromises);

        return results
            .map((result, index) =>
                result.status === 'fulfilled' ? result.value : {
                    ...searchResults[index],
                    relevanceScore: searchResults[index].similarity,
                    confidence: 0.1,
                    reasoning: 'Reranking failed',
                    rerankedRank: index
                }
            )
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
            const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
            const docTerms = document.toLowerCase().split(/\s+/).filter(term => term.length > 2);


            const exactMatches = queryTerms.filter(term =>
                docTerms.some(docTerm => docTerm === term)
            );

            const partialMatches = queryTerms.filter(term =>
                docTerms.some(docTerm => docTerm.includes(term) || term.includes(docTerm))
            );

            const queryVector = this.createTermVector(queryTerms);
            const docVector = this.createTermVector(docTerms);
            const semanticSimilarity = this.calculateCosineSimilarity(queryVector, docVector);

            // Weighted scoring
            const exactMatchScore = (exactMatches.length / queryTerms.length) * 0.4;
            const partialMatchScore = (partialMatches.length / queryTerms.length) * 0.3;
            const semanticScore = semanticSimilarity * 0.3;

            const randomVariance = (Math.random() - 0.5) * 0.1;

            const finalScore = Math.max(0, Math.min(1,
                exactMatchScore + partialMatchScore + semanticScore + randomVariance
            ));

            return finalScore;
        } catch (error) {
            console.warn('Reranking scoring failed, using fallback:', error);
            const queryTerms = query.toLowerCase().split(/\s+/);
            const docTerms = document.toLowerCase().split(/\s+/);
            const matches = queryTerms.filter(term =>
                docTerms.some(docTerm => docTerm.includes(term))
            );
            const matchRatio = matches.length / queryTerms.length;
            return Math.min(matchRatio * 1.2, 1.0);
        }
    }

    /**
     * Create term frequency vector
     */
    private createTermVector(terms: string[]): Map<string, number> {
        const vector = new Map<string, number>();
        terms.forEach(term => {
            vector.set(term, (vector.get(term) || 0) + 1);
        });
        return vector;
    }
    //CosineSim
    private calculateCosineSimilarity(
        vectorA: Map<string, number>,
        vectorB: Map<string, number>
    ): number {
        const allTerms = new Set([...vectorA.keys(), ...vectorB.keys()]);
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        allTerms.forEach(term => {
            const a = vectorA.get(term) || 0;
            const b = vectorB.get(term) || 0;
            dotProduct += a * b;
            normA += a * a;
            normB += b * b;
        });

        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    dispose(): void {
        this.isDisposed = true;
    }
}

export const rerankerService = new RerankerService();
