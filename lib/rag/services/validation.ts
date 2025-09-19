import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const BaseRAGQuerySchema = z.object({
    dataroomId: z.string().min(1, 'Dataroom ID is required'),
    viewerId: z.string().min(1, 'Viewer ID is required'),
    linkId: z.string().min(1, 'Link ID is required'),
    limit: z.string().nullable().optional().transform(val => val ? parseInt(val, 10) : 20),
    cursor: z.string().nullable().optional(),
});

export const SessionIdSchema = z.string().min(1, 'Session ID is required');

export const createErrorResponse = (message: string, status: number, details?: any) => {
    return NextResponse.json(
        {
            error: message,
            ...(details && { details }),
            timestamp: new Date().toISOString(),
        },
        { status }
    );
};

export const ERROR_MESSAGES = {
    VALIDATION_ERROR: 'Invalid request parameters',
    FETCH_FAILED: 'Failed to fetch data',
    SESSION_NOT_FOUND: 'Session not found or access denied',
} as const;

export const handleZodError = (error: z.ZodError) => {
    return createErrorResponse(
        ERROR_MESSAGES.VALIDATION_ERROR,
        400,
        error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
        }))
    );
};

export const handleSessionNotFoundError = (sessionId: string) => {
    return createErrorResponse(
        ERROR_MESSAGES.SESSION_NOT_FOUND,
        404,
        { sessionId }
    );
};

export const handleFetchError = (error: unknown, context?: string) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(
        ERROR_MESSAGES.FETCH_FAILED,
        500,
        {
            error: errorMessage,
            ...(context && { context })
        }
    );
};

export const validateLimit = (limit: number, maxLimit: number = 100, resourceType: string = 'items') => {
    if (limit > maxLimit) {
        return createErrorResponse(
            `Limit cannot exceed ${maxLimit} ${resourceType} per request`,
            400,
            { maxLimit, requestedLimit: limit }
        );
    }
    return null;
};

export function extractAndValidateQueryParams(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const queryParams = {
        dataroomId: searchParams.get('dataroomId'),
        viewerId: searchParams.get('viewerId'),
        linkId: searchParams.get('linkId'),
        limit: searchParams.get('limit'),
        cursor: searchParams.get('cursor'),
    };

    return BaseRAGQuerySchema.parse(queryParams);
}
