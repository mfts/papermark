import { textGenerationService } from '../text-generation';
import { RAGError } from '../errors';
import { Source } from '../types/rag-types';
import { UIMessage } from 'ai';
import { ChatMetadataTracker } from './chat-metadata-tracker.service';


export class ResponseGenerationService {
    private isDisposed = false;


    async generateAnswer(
        context: string,
        messages: UIMessage[],
        query: string,
        sources: Source[],
        abortSignal?: AbortSignal,
        chatSessionId?: string,
        metadataTracker?: ChatMetadataTracker
    ) {
        return RAGError.withErrorHandling(
            async () => {
                if (this.isDisposed) {
                    throw RAGError.create('serviceDisposed', undefined, { service: 'ResponseGenerationService' });
                }

                if (!query?.trim() || !messages?.length) {
                    throw RAGError.create('validation', 'Query and messages are required', { field: 'input', query: query?.trim(), messagesCount: messages?.length });
                }

                if (!context?.trim()) {
                    return await this.createFallbackResponse(query);
                }
                if (chatSessionId && metadataTracker) {
                    textGenerationService.setChatContext(chatSessionId, metadataTracker);
                }

                return await textGenerationService.generateRAGResponse(
                    context,
                    messages,
                    query,
                    sources,
                    abortSignal,
                    chatSessionId,
                    metadataTracker
                );
            },
            'responseGeneration',
            { service: 'ResponseGeneration', operation: 'generateAnswer', query }
        );
    }


    async createFallbackResponse(query: string) {
        return RAGError.withErrorHandling(
            async () => {
                if (this.isDisposed) {
                    throw RAGError.create('serviceDisposed', undefined, { service: 'ResponseGenerationService' });
                }

                return await textGenerationService.generateFallbackResponse(query);
            },
            'responseGeneration',
            { service: 'ResponseGeneration', operation: 'createFallbackResponse', query }
        );
    }
    dispose(): void {
        if (this.isDisposed) return;
        this.isDisposed = true;
    }

    get disposed(): boolean {
        return this.isDisposed;
    }
}

export const responseGenerationService = new ResponseGenerationService();
