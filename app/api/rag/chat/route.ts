import { NextRequest } from 'next/server';
import { ragMiddleware } from '@/lib/rag/middleware';
import { ragOrchestratorService } from '@/lib/rag/services/rag-orchestrator.service';
import { UnifiedQueryAnalysisResult, unifiedQueryAnalysisService } from '@/lib/rag/services/unified-query-analysis.service';
import { chatStorageService } from '@/lib/rag/services/chat-storage.service';
import { ChatMetadataTracker } from '@/lib/rag/services/chat-metadata-tracker.service';
import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';

const API_CONFIG = {
    REQUEST_TIMEOUT_MS: 60000,
    ANALYSIS_TIMEOUT_MS: 15000,
    SESSION_HEADER_NAME: 'X-Session-ID',
} as const;

const FALLBACK_RESPONSE = "I'm sorry, but I could not find the answer to your question in the provided documents.";

async function createFallbackResponse(
    message: string = FALLBACK_RESPONSE,
    chatSessionId?: string,
    metadataTracker?: ChatMetadataTracker
): Promise<Response> {
    const response = await createFallbackResponse(message, chatSessionId, metadataTracker);
    if (chatSessionId && response instanceof Response) {
        response.headers.set(API_CONFIG.SESSION_HEADER_NAME, chatSessionId);
    }
    return response;
}

function isAborted(signal: AbortSignal): boolean {
    return signal.aborted;
}

function createAbortResponse(message: string = 'Request aborted'): Response {
    return new Response(message, { status: 499 });
}

export async function POST(req: NextRequest) {
    let analysisController: AbortController | undefined;
    let chatSessionId: string | undefined;
    let metadataTracker: ChatMetadataTracker | undefined;

    try {
        const abortSignal = req.signal;

        const { messages, dataroomId, viewerId, query, linkId, selectedFolderIds, selectedDocIds, folderDocIds, sessionId } = await Promise.race([
            ragMiddleware.validateRequest(req),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`${FALLBACK_RESPONSE} after ${API_CONFIG.REQUEST_TIMEOUT_MS}ms`)),
                    API_CONFIG.REQUEST_TIMEOUT_MS)
            )
        ]);

        try {
            chatSessionId = await chatStorageService.getOrCreateSession({
                dataroomId,
                linkId,
                viewerId,
                title: query,
            }, sessionId || undefined);

            await chatStorageService.addMessage({
                sessionId: chatSessionId,
                role: 'user',
                content: query,
            });

            metadataTracker = ChatMetadataTracker.create();

        } catch (error) {
            console.error(FALLBACK_RESPONSE, error);
        }

        if (isAborted(abortSignal)) {
            console.log('🛑 Request aborted before analysis');
            return createAbortResponse(FALLBACK_RESPONSE);
        }

        analysisController = new AbortController();

        const combinedSignal = abortSignal || analysisController.signal;

        let analysisResult: UnifiedQueryAnalysisResult;
        try {
            if (metadataTracker) {
                metadataTracker.startQueryAnalysis();
            }

            analysisResult = await Promise.race([
                unifiedQueryAnalysisService.analyzeQuery(query, viewerId, dataroomId, combinedSignal, metadataTracker),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error(`Query analysis timeout after ${API_CONFIG.ANALYSIS_TIMEOUT_MS}ms`)),
                        API_CONFIG.ANALYSIS_TIMEOUT_MS)
                )
            ]);
            if (metadataTracker) {
                metadataTracker.endQueryAnalysis();
                metadataTracker.setQueryAnalysis({
                    queryType: analysisResult.queryClassification.type,
                    intent: analysisResult.queryClassification.intent,
                    complexityLevel: analysisResult.complexityAnalysis?.complexityLevel,
                    complexityScore: analysisResult.complexityAnalysis?.complexityScore
                });

                metadataTracker.setSearchStrategy({
                    strategy: analysisResult.searchStrategy?.strategy,
                    confidence: analysisResult.searchStrategy?.confidence,
                    reasoning: analysisResult.searchStrategy?.reasoning
                });
            }
        } catch (error) {
            if (isAborted(abortSignal) || (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted')))) {
                console.log('🛑 Query analysis aborted gracefully');
                return createAbortResponse('Request aborted by user');
            }

            console.error('Query analysis failed:', error);
            return await createFallbackResponse(FALLBACK_RESPONSE, chatSessionId, metadataTracker);
        }

        if (isAborted(abortSignal)) {
            console.log('🛑 Request aborted before processing');
            return createAbortResponse();
        }
        console.log('analysisResult', analysisResult)
        // 6. Handle chitchat/abusive queries
        if (['abusive', 'chitchat'].includes(analysisResult.queryClassification.type)) {
            const contextualResponse = analysisResult.queryClassification.response ||
                "I'm here to help you with your documents! How can I assist you with questions about your uploaded files?";
            const stream = createUIMessageStream({
                execute: ({ writer }) => {
                    const messageId = crypto.randomUUID();
                    writer.write({
                        type: 'text-start',
                        id: messageId
                    });
                    writer.write({
                        type: 'text-delta',
                        delta: contextualResponse,
                        id: messageId
                    });
                    writer.write({
                        type: 'text-end',
                        id: messageId
                    });
                }
            });

            return createUIMessageStreamResponse({ stream });
        }
        const sanitizedQuery = analysisResult.sanitization?.sanitizedQuery || query;
        const mentionedPageNumbers = analysisResult.queryExtraction?.pageNumbers || [];

        // Document Access Control & Permission Validation
        const { indexedDocuments, accessError } = await ragMiddleware.getAccessibleIndexedDocuments(
            dataroomId,
            viewerId,
            { selectedDocIds, selectedFolderIds, folderDocIds }
        );

        if (accessError || !indexedDocuments || indexedDocuments.length === 0) {
            return await createFallbackResponse(FALLBACK_RESPONSE, chatSessionId, metadataTracker);
        }

        const optimalStrategy = {
            strategy: analysisResult.searchStrategy?.strategy || 'StandardVectorSearch',
            confidence: analysisResult.searchStrategy?.confidence || 0.7
        };

        if (isAborted(abortSignal)) {
            console.log('🛑 Request aborted before RAG processing');
            return createAbortResponse();
        }

        try {
            const result = await ragOrchestratorService.processQuery(
                sanitizedQuery,
                dataroomId,
                indexedDocuments,
                messages,
                optimalStrategy.strategy,
                analysisResult.queryClassification.intent,
                analysisResult.complexityAnalysis,
                {
                    pageNumbers: mentionedPageNumbers,
                    queryRewriting: analysisResult.queryRewriting
                },
                API_CONFIG.REQUEST_TIMEOUT_MS,
                abortSignal,
                chatSessionId,
                metadataTracker
            );

            if (!result) {
                return await createFallbackResponse(FALLBACK_RESPONSE, chatSessionId, metadataTracker);
            }

            if (chatSessionId && result instanceof Response) {
                result.headers.set(API_CONFIG.SESSION_HEADER_NAME, chatSessionId);
            }
            return result;
        } catch (error) {
            if (isAborted(abortSignal) || (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted')))) {
                console.log('🛑 RAG processing aborted gracefully');
                return createAbortResponse('Request aborted by user');
            }

            return await createFallbackResponse(FALLBACK_RESPONSE, chatSessionId, metadataTracker);
        }

    } catch (error: unknown) {
        console.log('error', error)
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';

        console.error('RAG chat route error:', {
            error: errorMessage,
            timestamp: new Date().toISOString()
        });

        if (chatSessionId && metadataTracker) {
            metadataTracker.setError({
                type: 'GeneralError',
                message: errorMessage,
                isRetryable: true
            });
            metadataTracker.endTotal();
        }

        return await createFallbackResponse(FALLBACK_RESPONSE, chatSessionId, metadataTracker);
    } finally {
        if (analysisController) {
            analysisController.abort();
        }
    }
}


