import { promptManager } from '../prompts';
import { llmProvider } from '../llm/llm-provider';
import { LLMOptions } from '../types/rag-types';
import { RAGError } from '../errors';

export async function generateLLMResponse<T>(
    promptId: string,
    variables: Record<string, any>,
    options?: LLMOptions
): Promise<T> {
    return RAGError.withErrorHandling(
        async () => {
            const prompt = await promptManager.renderTemplate(promptId, variables);
            const schema = await promptManager.getTemplateSchema(promptId);
            const optimization = await promptManager.getTemplateOptimization(promptId);

            if (!schema) {
                throw RAGError.create('templateNotFound', undefined, { templateId: promptId });
            }

            const result = await llmProvider.generateObject(
                schema,
                prompt,
                {
                    temperature: optimization?.temperature,
                    model: optimization?.model,
                    signal: options?.signal,
                    ...options
                }
            );

            return result.content as T;
        },
        'llmCall',
        { service: 'LLMUtils', operation: 'generateLLMResponse', promptId }
    );
}
