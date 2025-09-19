import { NextRequest } from 'next/server';
import { ragMiddleware } from '@/lib/rag/middleware';
import { ragOrchestratorService } from '@/lib/rag/services/rag-orchestrator.service';
import { UnifiedQueryAnalysisResult, unifiedQueryAnalysisService } from '@/lib/rag/services/unified-query-analysis.service';
import { selectOptimalSearchStrategy } from '@/lib/rag/utils/similarity-utils';
import { textGenerationService } from '@/lib/rag/text-generation';
import { chatStorageService } from '@/lib/rag/services/chat-storage.service';
import { ChatMetadataTracker } from '@/lib/rag/services/chat-metadata-tracker.service';

const API_CONFIG = {
    REQUEST_TIMEOUT_MS: 60000,
    ANALYSIS_TIMEOUT_MS: 15000,
    SESSION_HEADER_NAME: 'X-Session-ID',
} as const;

const FALLBACK_RESPONSE = "I'm sorry, but I could not find the answer to your question in the provided documents.";

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

        if (abortSignal.aborted) {
            console.log('🛑 Request aborted before analysis');
            return new Response(FALLBACK_RESPONSE, { status: 499 });
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
            console.log('analysisResult', analysisResult);
            if (metadataTracker) {
                metadataTracker.endQueryAnalysis();
                metadataTracker.setQueryAnalysis({
                    queryType: analysisResult.queryClassification.type,
                    intent: analysisResult.queryClassification.intent,
                    complexityLevel: analysisResult.complexityAnalysis?.complexityLevel
                });
            }
        } catch (error) {
            if (abortSignal.aborted || (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted')))) {
                console.log('🛑 Query analysis aborted gracefully');
                return new Response('Request aborted by user', { status: 499 });
            }

            console.error('Query analysis failed:', error);

            const fallbackResponse = await textGenerationService.generateFallbackResponse(
                "I'm sorry, but I could not find the answer to your question in the provided documents.",
                chatSessionId,
                metadataTracker
            );
            return fallbackResponse;
        }


        if (abortSignal.aborted) {
            console.log('🛑 Request aborted before processing');
            return new Response('Request aborted', { status: 499 });
        }

        // 6. Handle chitchat/abusive queries
        if (['abusive', 'chitchat'].includes(analysisResult.queryClassification.type)) {
            const fallbackResponse = await textGenerationService.generateFallbackResponse(
                "I'm sorry, but I could not find the answer to your question in the provided documents.",
                chatSessionId,
                metadataTracker
            );
            return fallbackResponse;
        }

        // 4. Extract query parameters
        const sanitizedQuery = analysisResult.sanitization?.sanitizedQuery || query;
        const complexityScore = analysisResult.complexityAnalysis?.complexityScore || 0.5;
        const queryLength = analysisResult.complexityAnalysis?.wordCount || query.split(' ').length;
        const mentionedPageNumbers = analysisResult.queryExtraction?.pageNumbers || [];
        const keywords = analysisResult.queryExtraction?.keywords || [];


        // 5. Document Access Control & Permission Validation
        const { indexedDocuments, accessError } = await ragMiddleware.getAccessibleIndexedDocuments(
            dataroomId,
            viewerId,
            { selectedDocIds, selectedFolderIds, folderDocIds }
        );


        if (accessError || !indexedDocuments || indexedDocuments.length === 0) {

            const fallbackResponse = await textGenerationService.generateFallbackResponse(
                "I'm sorry, but I could not find the answer to your question in the provided documents.",
                chatSessionId,
                metadataTracker
            );
            return fallbackResponse;
        }

        const queryContext = {
            wordCount: analysisResult.complexityAnalysis.wordCount,
            keywords: keywords,
            mentionedPageNumbers
        };

        const analysisData = {
            intent: analysisResult.queryClassification.intent,
            requiresExpansion: analysisResult.queryClassification.requiresExpansion,
            optimalContextSize: analysisResult.queryClassification.optimalContextSize,
            processingStrategy: analysisResult.queryClassification.processingStrategy,
            complexityLevel: analysisResult.complexityAnalysis.complexityLevel,
            expansionStrategy: analysisResult.queryRewriting.expansionStrategy,
            requiresHyde: analysisResult.queryRewriting.requiresHyde,
            contextWindowHint: analysisResult.queryRewriting.contextWindowHint,
            generatedQueryCount: analysisResult.queryRewriting.generatedQueryCount || 0
        };

        const optimalStrategy = selectOptimalSearchStrategy(
            queryLength,
            complexityScore,
            indexedDocuments.length,
            queryContext,
            analysisData
        );

        console.log('🎯 Strategy Selection:', {
            strategy: optimalStrategy.search_strategy,
            confidence: optimalStrategy.confidence,
        });

        if (abortSignal.aborted) {
            console.log('🛑 Request aborted before RAG processing');
            return new Response('Request aborted', { status: 499 });
        }

        try {
            const result = await ragOrchestratorService.processQuery(
                sanitizedQuery,
                dataroomId,
                indexedDocuments,
                messages,
                optimalStrategy.search_strategy,
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

                if (chatSessionId && metadataTracker) {
                }

                const fallbackResponse = await textGenerationService.generateFallbackResponse(
                    FALLBACK_RESPONSE,
                    chatSessionId,
                    metadataTracker
                );
                if (chatSessionId && fallbackResponse instanceof Response) {
                    fallbackResponse.headers.set(API_CONFIG.SESSION_HEADER_NAME, chatSessionId);
                }
                return fallbackResponse;
            }

            if (chatSessionId && result instanceof Response) {
                result.headers.set(API_CONFIG.SESSION_HEADER_NAME, chatSessionId);
            }
            return result;
        } catch (error) {
            if (abortSignal.aborted || (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted')))) {
                console.log('🛑 RAG processing aborted gracefully');
                return new Response('Request aborted by user', { status: 499 });
            }

            const fallbackResponse = await textGenerationService.generateFallbackResponse(
                FALLBACK_RESPONSE,
                chatSessionId,
                metadataTracker
            );
            if (chatSessionId && fallbackResponse instanceof Response) {
                fallbackResponse.headers.set(API_CONFIG.SESSION_HEADER_NAME, chatSessionId);
            }
            return fallbackResponse;
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

        const fallbackResponse = await textGenerationService.generateFallbackResponse(
            FALLBACK_RESPONSE,
            chatSessionId,
            metadataTracker
        );
        if (chatSessionId && fallbackResponse instanceof Response) {
            fallbackResponse.headers.set(API_CONFIG.SESSION_HEADER_NAME, chatSessionId);
        }
        return fallbackResponse;
    } finally {
        if (analysisController) {
            analysisController.abort();
        }
    }
}


