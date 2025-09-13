import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { chatStorageService } from '@/lib/rag/services/chat-storage.service';

// Shared validation schema
const SessionsQuerySchema = z.object({
    dataroomId: z.string().min(1, 'Dataroom ID is required'),
    viewerId: z.string().min(1, 'Viewer ID is required'),
    linkId: z.string().min(1, 'Link ID is required'),
    page: z.string().nullable().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().nullable().optional().transform(val => val ? parseInt(val, 10) : 20),
    cursor: z.string().nullable().optional(),
});

// Shared error handling utility
const createErrorResponse = (message: string, status: number, details?: any) => {
    return NextResponse.json(
        {
            error: message,
            ...(details && { details }),
            timestamp: new Date().toISOString(),
        },
        { status }
    );
};

// Constants
const ERROR_MESSAGES = {
    VALIDATION_ERROR: 'Invalid request parameters',
    FETCH_FAILED: 'Failed to fetch sessions',
} as const;

export async function GET(req: NextRequest) {
    const startTime = Date.now();

    try {
        // Log request for audit trail
        console.log(`[SESSIONS_API] GET request started at ${new Date().toISOString()}`);

        const { searchParams } = new URL(req.url);

        // Extract and validate parameters with Zod
        const queryParams = {
            dataroomId: searchParams.get('dataroomId'),
            viewerId: searchParams.get('viewerId'),
            linkId: searchParams.get('linkId'),
            page: searchParams.get('page'),
            limit: searchParams.get('limit'),
            cursor: searchParams.get('cursor'),
        };

        // Validate with Zod schema
        const validatedParams = SessionsQuerySchema.parse(queryParams);

        // Validate request limits
        const limit = validatedParams.limit || 20;
        if (limit > 100) {
            return createErrorResponse(
                'Limit cannot exceed 100 sessions per request',
                400,
                { maxLimit: 100, requestedLimit: limit }
            );
        }

        const result = await chatStorageService.getSessionsPaginated({
            ...validatedParams,
            cursor: validatedParams.cursor || undefined,
        });

        // Log successful response
        const duration = Date.now() - startTime;
        console.log(`[SESSIONS_API] GET request completed in ${duration}ms, returned ${result.sessions.length} sessions`);

        return NextResponse.json(result);

    } catch (error) {
        const duration = Date.now() - startTime;

        // Handle Zod validation errors
        if (error instanceof z.ZodError) {
            console.error(`[SESSIONS_API] Validation error after ${duration}ms:`, error.errors);
            return createErrorResponse(
                ERROR_MESSAGES.VALIDATION_ERROR,
                400,
                error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            );
        }

        console.error(`[SESSIONS_API] Error after ${duration}ms:`, error);
        return createErrorResponse(ERROR_MESSAGES.FETCH_FAILED, 500);
    }
}
