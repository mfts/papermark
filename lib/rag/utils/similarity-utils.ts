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
export type SearchStrategyType = 'FastVectorSearch' | 'StandardVectorSearch' | 'ExpandedSearch';

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
            extraction: [8, 2, 0], // Strongly favors fast for direct lookups
            verification: [7, 3, 0], // Fast for fact-checking
            comparison: [0, 6, 4], // Needs multiple sources
            concept_explanation: [0, 5, 5], // Balanced approach
            analysis: [0, 3, 7], // Requires comprehensive search
            general_inquiry: [2, 6, 2], // Standard search preferred
        },
        complexityLevel: {
            low: [7, 2, 1], // Simple = fast
            medium: [2, 6, 2], // Medium = standard
            high: [0, 3, 7], // Complex = expanded
        },
        contextSize: {
            small: [6, 3, 1], // Small context = fast search
            medium: [2, 6, 2], // Medium context = standard
            large: [0, 2, 8], // Large context = expanded
        },
        processingStrategy: {
            precise: [5, 4, 1], // Precise = fast/standard
            comprehensive: [0, 3, 7], // Comprehensive = expanded
            comparative: [0, 5, 5], // Comparative = standard/expanded
            analytical: [0, 2, 8], // Analytical = expanded
        },
        expansionStrategy: {
            minimal: [6, 3, 1], // Minimal = fast
            moderate: [2, 6, 2], // Moderate = standard
            comprehensive: [0, 2, 8], // Comprehensive = expanded
        },
        contextWindow: {
            focused: [6, 3, 1], // Focused = fast
            balanced: [2, 6, 2], // Balanced = standard
            broad: [0, 2, 8], // Broad = expanded
        },
        boosts: {
            mentionedPageNumbers: [0, 4, 3], // Pages need more context
            highKeywordCount: [0, 3, 4], // Many keywords = complex search
            lowDocumentCount: [-8, 4, 0], // Few docs = avoid fast search
            highDocumentCount: [2, 0, 0], // Many docs = fast search OK
            generatedQueryCount: [0, 0, 2], // Multiple queries = expanded
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
        console.error('❌ Strategy selection failed:', error);
        // Safe fallback
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

