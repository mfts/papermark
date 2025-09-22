import { embed } from "ai";
import { openai } from '../openai';
import { RAGError } from './errors/rag-errors';

/**
 * Generate embedding for a single text using AI SDK v5
 */
export async function generateEmbedding(text: string, model: string = "text-embedding-3-small") {
    try {
        const { embedding, usage } = await embed({
            model: openai.textEmbeddingModel(model),
            value: text,
            maxRetries: 2,
        });

        return { embedding, usage };
    } catch (error) {
        throw RAGError.create('embedding', undefined, { textLength: text.length }, error instanceof Error ? error : new Error(String(error)));
    }
}
