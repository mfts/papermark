import { BaseLLMService } from '../llm/llm-interface';
import { promptManager, PROMPT_IDS } from '../prompts';
import { RAGError } from '../errors';
import { llmProvider } from '../llm/llm-provider';

export interface UnifiedQueryAnalysisResult {
    sanitization: {
        isValid: boolean;
        sanitizedQuery: string;
        toxicityScore: number;
        sanitizationLevel: 'safe' | 'suspicious' | 'blocked';
    };
    queryClassification: {
        type: 'abusive' | 'chitchat' | 'document_question';
        intent: 'extraction' | 'summarization' | 'comparison' | 'concept_explanation' | 'analysis' | 'verification' | 'general_inquiry';
        confidence: number;
        response: string;
        requiresExpansion: boolean;
        optimalContextSize: 'small' | 'medium' | 'large';
        processingStrategy: 'precise' | 'comprehensive' | 'comparative' | 'analytical';
    };
    complexityAnalysis: {
        complexityScore: number;
        complexityLevel: 'low' | 'medium' | 'high';
        wordCount: number;
    };
    queryExtraction: {
        pageNumbers: number[];
        keywords: string[];
    };
    queryRewriting: {
        rewrittenQueries: string[];
        hydeAnswer: string;
        generatedQueryCount: number;
        expansionStrategy: 'minimal' | 'moderate' | 'comprehensive';
        requiresHyde: boolean;
        contextWindowHint: 'focused' | 'balanced' | 'broad';
    };
}

export class UnifiedQueryAnalysisService extends BaseLLMService {
    async analyzeQuery(
        query: string,
        viewerId: string,
        dataroomId: string,
        signal?: AbortSignal,
    ): Promise<UnifiedQueryAnalysisResult> {
        return RAGError.withErrorHandling(
            async () => {
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
                const result = response.content as UnifiedQueryAnalysisResult;
                return result;
            },
            'queryAnalysis',
            { service: 'UnifiedQueryAnalysis', operation: 'analyzeQuery', query, viewerId, dataroomId }
        );
    }
}

export const unifiedQueryAnalysisService = new UnifiedQueryAnalysisService(llmProvider);
