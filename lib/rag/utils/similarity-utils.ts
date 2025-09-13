import { SearchResult } from '../types/rag-types';

export function calculateAverageSimilarity<T extends { similarity?: number }>(results: T[]): number {
    if (results.length === 0) return 0;

    const validResults = results.filter(r => r.similarity !== undefined && r.similarity !== null);
    if (validResults.length === 0) return 0;

    const sum = validResults.reduce((acc, r) => acc + (r.similarity || 0), 0);
    return sum / validResults.length;
}

export interface SearchQualityMetrics {
    uniqueHits: number;
    avgSimilarity: number;
    totalResults: number;
}
export type SearchStrategyType = 'FastVectorSearch' | 'StandardVectorSearch' | 'ExpandedSearch' | 'PageQueryStrategy';

export interface SearchStrategy {
    search_strategy: SearchStrategyType;
    confidence: number;
}

const STRATEGY_CONFIG = {
    knockoutRules: {
        summarization: { strategy: 'ExpandedSearch', confidence: 1.0 },
        requiresHyde: { strategy: 'ExpandedSearch', confidence: 1.0 },
        highComplexityWithAnalysis: { strategy: 'ExpandedSearch', confidence: 0.95 },
        lowComplexityWithExtraction: { strategy: 'FastVectorSearch', confidence: 0.9 },
    },

    weights: {
        intent: {
            extraction: [6, 4, 0],
            verification: [5, 5, 0],
            comparison: [0, 8, 2],
            concept_explanation: [0, 8, 2],
            analysis: [0, 6, 4],
            general_inquiry: [2, 8, 0],
        },
        complexityLevel: {
            low: [5, 5, 0],
            medium: [0, 8, 2],
            high: [0, 6, 4],
        },
        contextSize: {
            small: [4, 6, 0],
            medium: [0, 8, 2],
            large: [0, 6, 4],
        },
        processingStrategy: {
            precise: [3, 7, 0],
            comprehensive: [0, 6, 4],
            comparative: [0, 8, 2],
            analytical: [0, 6, 4],
        },
        expansionStrategy: {
            minimal: [4, 6, 0],
            moderate: [0, 8, 2],
            comprehensive: [0, 6, 4],
        },
        contextWindow: {
            focused: [4, 6, 0],
            balanced: [0, 8, 2],
            broad: [0, 6, 4],
        },
        boosts: {
            mentionedPageNumbers: [0, 6, 2],
            highKeywordCount: [0, 6, 2],
            lowDocumentCount: [-6, 6, 0],
            highDocumentCount: [2, 6, 0],
            generatedQueryCount: [0, 6, 2],
        }
    },
    thresholds: {
        confidence: 0.6, // Higher confidence requirement
        marginOfVictory: 0.15, // Larger margin required
        complexityBoost: 0.7, // High complexity boost threshold
    }
};

export function selectOptimalSearchStrategy(
    queryLength: number,
    complexityScore: number,
    documentCount: number,
    queryContext?: {
        wordCount: number;
        keywords: string[];
        mentionedPageNumbers: number[];
    },
    analysisResult?: {
        intent: 'extraction' | 'summarization' | 'comparison' | 'concept_explanation' | 'analysis' | 'verification' | 'general_inquiry';
        requiresExpansion: boolean;
        optimalContextSize: 'small' | 'medium' | 'large';
        processingStrategy: 'precise' | 'comprehensive' | 'comparative' | 'analytical';
        complexityLevel: 'low' | 'medium' | 'high';
        expansionStrategy: 'minimal' | 'moderate' | 'comprehensive';
        requiresHyde: boolean;
        contextWindowHint: 'focused' | 'balanced' | 'broad';
        generatedQueryCount: number
    }
): SearchStrategy {
    try {
        if (queryContext?.mentionedPageNumbers && queryContext.mentionedPageNumbers.length > 0) {
            return {
                search_strategy: 'PageQueryStrategy',
                confidence: 0.95
            };
        }

        if (!analysisResult) {
            if (queryLength <= 15 && complexityScore <= 0.4 && documentCount >= 5) {
                return { search_strategy: 'FastVectorSearch', confidence: 0.8 };
            } else if (queryLength <= 30 && complexityScore <= 0.6) {
                return { search_strategy: 'StandardVectorSearch', confidence: 0.7 };
            } else {
                return { search_strategy: 'ExpandedSearch', confidence: 0.6 };
            }
        }

        const {
            intent,
            complexityLevel,
            expansionStrategy,
            requiresHyde,
            optimalContextSize,
            processingStrategy,
            contextWindowHint,
            generatedQueryCount
        } = analysisResult;
        if (intent === 'summarization') {
            return {
                search_strategy: 'ExpandedSearch',
                confidence: 1.0
            };
        }
        if (requiresHyde) {
            return {
                search_strategy: 'ExpandedSearch',
                confidence: 1.0
            };
        }
        if (complexityLevel === 'high' && intent === 'analysis') {
            return {
                search_strategy: 'ExpandedSearch',
                confidence: 0.95
            };
        }
        if (complexityLevel === 'low' && intent === 'extraction' && documentCount >= 5) {
            return {
                search_strategy: 'FastVectorSearch',
                confidence: 0.9
            };
        }
        let scores: [number, number, number] = [0, 0, 0];
        const applyPoints = (points: number[]) => {
            scores[0] += points[0];
            scores[1] += points[1];
            scores[2] += points[2];
        };
        applyPoints(STRATEGY_CONFIG.weights.intent[intent]);
        applyPoints(STRATEGY_CONFIG.weights.complexityLevel[complexityLevel]);
        applyPoints(STRATEGY_CONFIG.weights.contextSize[optimalContextSize]);
        applyPoints(STRATEGY_CONFIG.weights.processingStrategy[processingStrategy]);
        applyPoints(STRATEGY_CONFIG.weights.expansionStrategy[expansionStrategy]);
        applyPoints(STRATEGY_CONFIG.weights.contextWindow[contextWindowHint]);
        if (queryContext?.mentionedPageNumbers.length ?? 0 > 0) {
            applyPoints(STRATEGY_CONFIG.weights.boosts.mentionedPageNumbers);
        }
        if (queryContext?.keywords.length ?? 0 > 6) {
            applyPoints(STRATEGY_CONFIG.weights.boosts.highKeywordCount);
        }
        if (documentCount < 5) {
            applyPoints(STRATEGY_CONFIG.weights.boosts.lowDocumentCount);
        } else if (documentCount > 50) {
            applyPoints(STRATEGY_CONFIG.weights.boosts.highDocumentCount);
        }
        if (generatedQueryCount > 3) {
            applyPoints(STRATEGY_CONFIG.weights.boosts.generatedQueryCount);
        }
        const [fastScore, standardScore, expandedScore] = scores;
        const totalScore = Math.max(1, fastScore + standardScore + expandedScore);
        const strategies = [
            { strategy: 'FastVectorSearch' as SearchStrategyType, score: fastScore },
            { strategy: 'StandardVectorSearch' as SearchStrategyType, score: standardScore },
            { strategy: 'ExpandedSearch' as SearchStrategyType, score: expandedScore },
        ].sort((a, b) => b.score - a.score);

        const winner = strategies[0];
        const runnerUp = strategies[1];
        const confidence = parseFloat((winner.score / totalScore).toFixed(2));
        const marginOfVictory = parseFloat(((winner.score - runnerUp.score) / totalScore).toFixed(2));

        let finalStrategy = winner.strategy;
        if (confidence < STRATEGY_CONFIG.thresholds.confidence || marginOfVictory < STRATEGY_CONFIG.thresholds.marginOfVictory) {
            if (finalStrategy === 'FastVectorSearch') {
                finalStrategy = 'StandardVectorSearch';
            } else if (finalStrategy === 'StandardVectorSearch') {
                finalStrategy = 'ExpandedSearch';
            }
        }

        return {
            search_strategy: finalStrategy,
            confidence,
        };

    } catch (error) {
        return {
            search_strategy: 'StandardVectorSearch',
            confidence: 0.5,
        };
    }
}

export function assessSearchQuality(results: SearchResult[]): SearchQualityMetrics {
    const uniqueHits = new Set(results.map(r => r.chunkId)).size;
    const avgSimilarity = calculateAverageSimilarity(results);

    return {
        uniqueHits,
        avgSimilarity,
        totalResults: results.length
    };
}

