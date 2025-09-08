import {
    QueryProcessingResult,
    RAG_CONSTANTS,
    PhaseResults
} from '../types/rag-types';
import { queryRoutingService } from '../query-routing';
import { sanitizeQuery, detectQueryComplexity } from '../utils';
import { configurationManager } from '../config';
import { RAGError } from '../errors';
import { AccessibleDocument } from '../document-permissions';

const QUERY_ANALYSIS_CONFIG = {
    ROUTING_TIMEOUT_MS: 20000,
    DEFAULT_CONFIDENCE: RAG_CONSTANTS.LOW_CONFIDENCE
} as const;

export class QueryAnalysisService {
    private ragConfig = configurationManager.getRAGConfig();
    private isDisposed = false;
    async analyzeAndRouteQuery(
        query: string,
        indexedDocuments: AccessibleDocument[],
        signal?: AbortSignal
    ): Promise<QueryProcessingResult> {
        if (this.isDisposed) {
            throw RAGError.create('serviceDisposed', undefined, { service: 'QueryAnalysisService' });
        }

        return RAGError.withErrorHandling(
            async () => {
                // Input validation
                this.validateQueryInputs(query, indexedDocuments);

                const startTime = Date.now();

                // 1. Sanitize and validate query
                const sanitizedQuery = sanitizeQuery(query);
                const isComplex = detectQueryComplexity(sanitizedQuery);

                // 2. Generate query variations (simplified for now)
                const queryVariations = [sanitizedQuery];

                // 3. Analyze query complexity and type
                const queryType = isComplex ? 'complex' : 'simple';

                // 4. Query processing with routing and timeout protection
                let routingDecision: any;
                try {
                    routingDecision = await Promise.race([
                        queryRoutingService.routeQuery(sanitizedQuery),
                        new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error(`Routing timeout after ${QUERY_ANALYSIS_CONFIG.ROUTING_TIMEOUT_MS}ms`)),
                                QUERY_ANALYSIS_CONFIG.ROUTING_TIMEOUT_MS)
                        )
                    ]);
                } catch (error) {
                    // Fallback to default routing
                    routingDecision = {
                        searchStrategy: 'semantic' as const,
                        confidence: QUERY_ANALYSIS_CONFIG.DEFAULT_CONFIDENCE,
                        reasoning: 'Fallback routing due to error'
                    };
                }


                const phaseResults: PhaseResults = {
                    phase1: true, // Sanitization completed
                    phase2: true, // Complexity analysis completed
                    phase3: true, // Query variations generated
                    phase4: true, // Routing decision made
                    phase5: true  // Result processing completed
                };

                // 6. Create processing result
                const processingTime = Date.now() - startTime;
                const result: QueryProcessingResult = {
                    originalQuery: query,
                    finalQueries: queryVariations,
                    routingDecision,
                    phaseResults,
                    metadata: {
                        cacheHit: false,
                        processingTime,
                        queryComplexity: queryType,
                        deduplicationRemoved: 0
                    }
                };

                return result;
            },
            'queryAnalysis',
            { service: 'QueryAnalysis', operation: 'analyzeAndRouteQuery' }
        );
    }

    /**
     * Validate query analysis inputs
     */
    private validateQueryInputs(query: string, indexedDocuments: AccessibleDocument[]): void {
        if (!query || query.trim().length === 0) {
            throw RAGError.create('validation', 'Query cannot be empty', { field: 'query' });
        }
        if (!indexedDocuments || indexedDocuments.length === 0) {
            throw RAGError.create('validation', 'Indexed documents cannot be empty', { field: 'indexedDocuments' });
        }
    }

    /**
     * Dispose service
     */
    dispose(): void {
        this.isDisposed = true;
    }
}

export const queryAnalysisService = new QueryAnalysisService();
