import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { chatStorageService } from '@/lib/rag/services/chat-storage.service';
import { SessionIdSchema, handleZodError, handleSessionNotFoundError, handleFetchError, validateLimit, extractAndValidateQueryParams } from '@/lib/rag/services/validation';

export async function GET(
    req: NextRequest,
    { params }: { params: { sessionId: string } }
) {
    try {
        const sessionId = SessionIdSchema.parse(params.sessionId);
        const validatedParams = extractAndValidateQueryParams(req);

        const limit = validatedParams.limit || 20;
        const limitError = validateLimit(limit, 100, 'messages');
        if (limitError) return limitError;

        const result = await chatStorageService.getSessionMessages({
            sessionId,
            dataroomId: validatedParams.dataroomId,
            linkId: validatedParams.linkId,
            viewerId: validatedParams.viewerId,
            limit: validatedParams.limit,
            cursor: validatedParams.cursor || undefined,
        });

        const response = {
            sessionId: result.sessionId,
            messages: result.messages,
            pagination: {
                hasNext: result.messages.length === limit,
                nextCursor: result.messages.length === limit ? result.messages[0]?.id : null,
            }
        };

        return NextResponse.json(response);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return handleZodError(error);
        }

        if (error instanceof Error && error.message.includes('Session not found')) {
            return handleSessionNotFoundError(params.sessionId);
        }

        return handleFetchError(error, 'session-messages');
    }
}