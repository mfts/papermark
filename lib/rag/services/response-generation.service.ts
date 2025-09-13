import { textGenerationService } from '../text-generation';
import { RAGError } from '../errors';
import { UIMessage } from 'ai';
import { ChatMetadataTracker } from './chat-metadata-tracker.service';


export class ResponseGenerationService {
    private isDisposed = false;
    private static instance: ResponseGenerationService | null = null;

    private constructor() {
    }
    static getInstance(): ResponseGenerationService {
        if (!ResponseGenerationService.instance) {
            ResponseGenerationService.instance = new ResponseGenerationService();
        }
        return ResponseGenerationService.instance;
    }

    async generateAnswer(
        context: string,
        messages: UIMessage[],
        query: string,
        abortSignal?: AbortSignal,
        chatSessionId?: string,
        metadataTracker?: ChatMetadataTracker,
        pageNumbers?: number[]
    ): Promise<Response> {
        return RAGError.withErrorHandling(
            async () => {
                this.validateServiceState();
                this.validateInputs(query, messages);

                if (!context?.trim()) {
                    return await this.createFallbackResponse(query, chatSessionId, metadataTracker);
                }

                return await textGenerationService.generateRAGResponse(
                    context,
                    messages,
                    query,
                    abortSignal,
                    chatSessionId,
                    metadataTracker,
                    pageNumbers
                );
            },
            'responseGeneration',
            { service: 'ResponseGeneration', operation: 'generateAnswer', query }
        );
    }


    private async createFallbackResponse(
        query: string,
        chatSessionId?: string,
        metadataTracker?: ChatMetadataTracker
    ): Promise<Response> {
        return RAGError.withErrorHandling(
            async () => {
                this.validateServiceState();

                return await textGenerationService.generateFallbackResponse(query, chatSessionId, metadataTracker);
            },
            'responseGeneration',
            { service: 'ResponseGeneration', operation: 'createFallbackResponse', query }
        );
    }

    private validateServiceState(): void {
        if (this.isDisposed) {
            throw RAGError.create('serviceDisposed', undefined, { service: 'ResponseGenerationService' });
        }
    }

    static resetInstance(): void {
        ResponseGenerationService.instance = null;
    }

    private validateInputs(query: string, messages: UIMessage[]): void {
        if (!query?.trim()) {
            throw RAGError.create('validation', 'Query is required', { field: 'query' });
        }
        if (!messages?.length) {
            throw RAGError.create('validation', 'Messages are required', { field: 'messages' });
        }
    }
    dispose(): void {
        if (this.isDisposed) return;
        this.isDisposed = true;
    }

    get disposed(): boolean {
        return this.isDisposed;
    }
}

export const responseGenerationService = ResponseGenerationService.getInstance();
