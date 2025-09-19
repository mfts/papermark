import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { chatStorageService } from '@/lib/rag/services/chat-storage.service';
import { handleZodError, handleFetchError, validateLimit, extractAndValidateQueryParams } from '@/lib/rag/services/validation';

export async function GET(req: NextRequest) {
    try {
        const validatedParams = extractAndValidateQueryParams(req);

        const limit = validatedParams.limit || 20;
        const limitError = validateLimit(limit, 100, 'sessions');
        if (limitError) return limitError;

        const result = await chatStorageService.getSessionsPaginated({
            dataroomId: validatedParams.dataroomId,
            viewerId: validatedParams.viewerId,
            linkId: validatedParams.linkId,
            limit: validatedParams.limit,
            cursor: validatedParams.cursor || undefined,
        });

        return NextResponse.json({
            sessions: result.sessions,
            pagination: result.pagination,
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return handleZodError(error);
        }

        return handleFetchError(error, 'sessions');
    }
}