import { BaseLLMService, llmProvider } from '../llm';
import { promptManager, PROMPT_IDS } from '../prompts';
import { RAGError } from '../errors/rag-errors';

export interface UnifiedQueryAnalysisResult {
    sanitization: {
        sanitizedQuery: string;
    };
    queryClassification: {
        type: 'abusive' | 'chitchat' | 'document_question';
        intent: 'extraction' | 'summarization' | 'comparison' | 'concept_explanation' | 'analysis' | 'verification' | 'general_inquiry';
        response: string;
        requiresExpansion: boolean;
        optimalContextSize: 'small' | 'medium' | 'large';
    };
    complexityAnalysis: {
        complexityScore: number;
        complexityLevel: 'low' | 'medium' | 'high';
    };
    queryExtraction: {
        pageNumbers: number[];
    };
    queryRewriting: {
        rewrittenQueries: string[];
        hydeAnswer: string;
        requiresHyde: boolean;
    };
    searchStrategy: {
        strategy: 'FastVectorSearch' | 'StandardVectorSearch' | 'ExpandedSearch' | 'PageQueryStrategy';
        confidence: number;
        reasoning: string;
    };
}

export class UnifiedQueryAnalysisService extends BaseLLMService {
    constructor(provider: any) {
        super(provider);
    }
    async analyzeQuery(
        query: string,
        viewerId: string,
        dataroomId: string,
        signal?: AbortSignal,
        metadataTracker?: any
    ): Promise<UnifiedQueryAnalysisResult> {
        return RAGError.withErrorHandling(
            async () => {
                if (process.env.NODE_ENV === 'development') {
                    console.log('🔍 Query Analysis Started:', {
                        query: query.substring(0, 80) + (query.length > 80 ? '...' : ''),
                        viewerId: viewerId.substring(0, 8) + '...',
                        dataroomId: dataroomId.substring(0, 8) + '...'
                    });
                }

                const template = await promptManager.getTemplate(PROMPT_IDS.UNIFIED_QUERY_ANALYSIS);
                if (!template) {
                    throw RAGError.create('missingConfiguration', undefined, { service: 'UnifiedQueryAnalysis', config: 'promptTemplate' });
                }

                const prompt = await promptManager.renderTemplate(PROMPT_IDS.UNIFIED_QUERY_ANALYSIS, {
                    query,
                });

                const response = await this.generateObject(
                    template.schema!,
                    prompt,
                    {
                        maxTokens: template.optimization?.maxTokens || 350,
                        signal
                    }
                );

                if (metadataTracker && response.usage) {
                    metadataTracker.setTokenUsage({
                        inputTokens: response.usage.inputTokens,
                        outputTokens: response.usage.outputTokens,
                        totalTokens: response.usage.totalTokens,
                    });
                }

                const result = response.content as UnifiedQueryAnalysisResult;
                if (process.env.NODE_ENV === 'development') {
                    console.log('✅ Query Analysis Completed:', {
                        type: result.queryClassification.type,
                        intent: result.queryClassification.intent,
                        complexityLevel: result.complexityAnalysis.complexityLevel,
                        strategy: result.searchStrategy.strategy,
                        confidence: result.searchStrategy.confidence,
                        pageNumbers: result.queryExtraction.pageNumbers.length > 0 ? result.queryExtraction.pageNumbers : 'none'
                    });
                }

                return result;
            },
            'queryAnalysis',
            { service: 'UnifiedQueryAnalysis', operation: 'analyzeQuery', query, viewerId, dataroomId }
        );
    }
}

export const unifiedQueryAnalysisService = new UnifiedQueryAnalysisService(llmProvider);
