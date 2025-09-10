import { NextRequest, NextResponse } from 'next/server';
import { ragMiddleware } from '@/lib/rag/middleware';
import { ragOrchestratorService } from '@/lib/rag/services/rag-orchestrator.service';
import { UnifiedQueryAnalysisResult, unifiedQueryAnalysisService } from '@/lib/rag/services/unified-query-analysis.service';
import { selectOptimalSearchStrategy } from '@/lib/rag/utils/similarity-utils';
import { textGenerationService } from '@/lib/rag/text-generation';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { chatStorageService } from '@/lib/rag/services/chat-storage.service';
import { ChatMetadataTracker } from '@/lib/rag/services/chat-metadata-tracker.service';

const API_CONFIG = {
    REQUEST_TIMEOUT_MS: 60000, // 60 seconds for full request
    ANALYSIS_TIMEOUT_MS: 10000  // 10 seconds for analysis only
} as const;

export async function POST(req: NextRequest) {
    let analysisController: AbortController | undefined;
    let chatSessionId: string | undefined;
    let metadataTracker: ChatMetadataTracker | undefined;

    try {
        const abortSignal = req.signal;

        const { messages, dataroomId, viewerId, query, linkId, selectedFolderIds, selectedDocIds, folderDocIds } = await Promise.race([
            ragMiddleware.validateRequest(req),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`Request validation timeout after ${API_CONFIG.REQUEST_TIMEOUT_MS}ms`)),
                    API_CONFIG.REQUEST_TIMEOUT_MS)
            )
        ]);

        try {
            chatSessionId = await chatStorageService.createSession({
                dataroomId,
                linkId,
                viewerId,
            });

            await chatStorageService.addMessage({
                sessionId: chatSessionId,
                role: 'user',
                content: query,
            });

            metadataTracker = ChatMetadataTracker.create();

        } catch (error) {
            console.error('Failed to create chat session:', error);
        }

        if (abortSignal.aborted) {
            console.log('🛑 Request aborted before analysis');
            return new Response('Request aborted', { status: 499 });
        }


        analysisController = new AbortController();

        const combinedSignal = abortSignal || analysisController.signal;

        let analysisResult: UnifiedQueryAnalysisResult;
        try {
            analysisResult = await Promise.race([
                unifiedQueryAnalysisService.analyzeQuery(query, viewerId, dataroomId, combinedSignal),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error(`Query analysis timeout after ${API_CONFIG.ANALYSIS_TIMEOUT_MS}ms`)),
                        API_CONFIG.ANALYSIS_TIMEOUT_MS)
                )
            ]);
        } catch (error) {
            if (abortSignal.aborted || (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted')))) {
                console.log('🛑 Query analysis aborted gracefully');
                return new Response('Request aborted by user', { status: 499 });
            }

            console.error('Query analysis failed:', error);


            const fallbackResponse = await textGenerationService.generateSimpleResponse(
                "I'm having trouble understanding your query. Please try rephrasing it.",
                [{ id: 'fallback-user', role: 'user', parts: [{ type: 'text', text: query }] }],
                undefined,
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
            const responseText = analysisResult.queryClassification.response;
            const stream = streamText({
                model: openai('gpt-4o-mini'),
                prompt: `You are a helpful assistant. Respond with exactly this text, no additional content: ${responseText}`,
                temperature: 0,
                abortSignal: abortSignal,
                onError: (error) => {
                    console.error('streamText error in chitchat/abusive handling:', error);
                },
            });
            return stream.toUIMessageStreamResponse();
        }

        // 4. Extract query parameters
        const sanitizedQuery = analysisResult.sanitization?.sanitizedQuery || query;
        const complexityScore = analysisResult.complexityAnalysis?.complexityScore || 0.5;
        const queryLength = analysisResult.complexityAnalysis?.wordCount || query.split(' ').length;
        const mentionedPageNumbers = analysisResult.queryExtraction?.pageNumbers || [];
        const keywords = analysisResult.queryExtraction?.keywords || [];

        // 4.5. Chat Session Management (already done above)

        // 5. Document Access Control & Permission Validation
        const { indexedDocuments, accessError } = await ragMiddleware.getAccessibleIndexedDocuments(
            dataroomId,
            viewerId,
            { selectedDocIds, selectedFolderIds, folderDocIds }
        );


        if (accessError || !indexedDocuments || indexedDocuments.length === 0) {
            // Set chat context for fallback response storage

            const fallbackResponse = await textGenerationService.generateFallbackResponse(
                accessError || "No documents are available for search. Please ensure documents are properly indexed.",
                chatSessionId,
                metadataTracker
            );
            return fallbackResponse;
        }

        // 6. Enhanced Strategy Selection
        const queryContext = {
            wordCount: analysisResult.complexityAnalysis.wordCount,
            keywords: analysisResult.queryExtraction.keywords,
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

        // 7. Check if request was aborted before RAG processing
        if (abortSignal.aborted) {
            console.log('🛑 Request aborted before RAG processing');
            return new Response('Request aborted', { status: 499 });
        }

        // 8. Process Query with RAG Orchestrator (pass abort signal)
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
                    keywords,
                    queryRewriting: analysisResult.queryRewriting
                },
                API_CONFIG.REQUEST_TIMEOUT_MS, // timeout
                abortSignal, // Pass the abort signal
                chatSessionId, // Chat session ID
                metadataTracker // Metadata tracker
            );

            // 8. Return streaming response
            if (!result) {
                // Set chat context for fallback response storage
                if (chatSessionId && metadataTracker) {
                }

                const fallbackResponse = await textGenerationService.generateFallbackResponse(
                    "Unable to process your query. Please try again.",
                    chatSessionId,
                    metadataTracker
                );
                return fallbackResponse;
            }

            return result;
        } catch (error) {
            if (abortSignal.aborted || (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted')))) {
                console.log('🛑 RAG processing aborted gracefully');
                return new Response('Request aborted by user', { status: 499 });
            }

            // Set chat context for fallback response storage

            const fallbackResponse = await textGenerationService.generateFallbackResponse(
                "I encountered an issue processing your query. Please try again.",
                chatSessionId,
                metadataTracker
            );
            return fallbackResponse;
        }

    } catch (error: unknown) {
        console.log('error', error)
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';

        console.error('RAG chat route error:', {
            error: errorMessage,
            timestamp: new Date().toISOString()
        });

        // Set chat context for fallback response storage if available
        if (chatSessionId && metadataTracker) {
        }

        const fallbackResponse = await textGenerationService.generateFallbackResponse(
            `An error occurred: ${errorMessage}. Please try again or contact support if the problem persists.`,
            chatSessionId,
            metadataTracker
        );
        return fallbackResponse;
    } finally {
        if (analysisController) {
            analysisController.abort();
        }
    }
}


