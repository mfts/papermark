import { detectQueryComplexity } from './utils';
import { PROMPT_IDS } from './prompts';
import { generateLLMResponse } from './utils/llm-utils';
import { QUERY_PATTERNS } from './constants/patterns';

// Constants for better maintainability
const CONFIDENCE_LEVELS = {
    HIGH: 0.8,
    MEDIUM: 0.7,
    LOW: 0.6,
    DEFAULT: 0.5
} as const;

export interface RoutingDecision {
    searchStrategy: 'semantic' | 'keyword' | 'hybrid' | 'structured' | 'general';
    queryOptimization: 'expand' | 'decompose' | 'abstract' | 'none';
    confidence: number;
    reasoning: string;
    queryType: 'simple' | 'complex' | 'comparative' | 'factual' | 'temporal' | 'numerical';
    suggestedFilters: Record<string, any>;
}

/**
 * Simplified Query Routing Service
 * Focuses on basic query optimization strategies
 */
export class QueryRoutingService {

    /**
     * Route query to appropriate optimization strategy
     */
    async routeQuery(query: string): Promise<RoutingDecision> {
        const isComplex = detectQueryComplexity(query);
        return isComplex ? await this.logicalRouting(query) : this.simpleRouting(query);
    }

    /**
     * Logical routing for complex queries using LLM analysis
     */
    private async logicalRouting(query: string): Promise<RoutingDecision> {
        const result = await generateLLMResponse<{
            searchStrategy: string;
            queryOptimization: string;
            confidence: number;
            reasoning: string;
            queryType: string;
            suggestedFilters: Record<string, any>;
        }>(
            PROMPT_IDS.QUERY_ROUTING_LOGICAL,
            { query }
        );

        return {
            searchStrategy: result.searchStrategy as RoutingDecision['searchStrategy'],
            queryOptimization: result.queryOptimization as RoutingDecision['queryOptimization'],
            confidence: result.confidence,
            reasoning: result.reasoning,
            queryType: result.queryType as RoutingDecision['queryType'],
            suggestedFilters: result.suggestedFilters
        };
    }

    /**
     * Simple routing for basic queries
     */
    private simpleRouting(query: string): RoutingDecision {
        // Check for specific query patterns
        const queryLower = query.toLowerCase();

        // Conversational queries
        if (this.isConversational(queryLower)) {
            return {
                searchStrategy: 'general',
                queryOptimization: 'none',
                confidence: CONFIDENCE_LEVELS.HIGH,
                reasoning: 'Conversational query detected',
                queryType: 'simple',
                suggestedFilters: {}
            };
        }

        // Factual queries
        if (this.isFactual(queryLower)) {
            return {
                searchStrategy: 'semantic',
                queryOptimization: 'expand',
                confidence: CONFIDENCE_LEVELS.MEDIUM,
                reasoning: 'Factual query detected',
                queryType: 'factual',
                suggestedFilters: {}
            };
        }

        // Comparative queries
        if (this.isComparative(queryLower)) {
            return {
                searchStrategy: 'hybrid',
                queryOptimization: 'decompose',
                confidence: CONFIDENCE_LEVELS.LOW,
                reasoning: 'Comparative query detected',
                queryType: 'comparative',
                suggestedFilters: {}
            };
        }

        // Default to semantic search
        return {
            searchStrategy: 'semantic',
            queryOptimization: 'none',
            confidence: CONFIDENCE_LEVELS.DEFAULT,
            reasoning: 'Default semantic search',
            queryType: 'simple',
            suggestedFilters: {}
        };
    }

    /**
     * Check if query is conversational
     */
    private isConversational(query: string): boolean {
        return QUERY_PATTERNS.conversational.some(pattern => query.includes(pattern));
    }

    /**
     * Check if query is factual
     */
    private isFactual(query: string): boolean {
        return QUERY_PATTERNS.complexity.medium.some(pattern => query.includes(pattern));
    }

    /**
     * Check if query is comparative
     */
    private isComparative(query: string): boolean {
        return QUERY_PATTERNS.complexity.high.some(pattern => query.includes(pattern));
    }
}

// Export singleton instance
export const queryRoutingService = new QueryRoutingService();
