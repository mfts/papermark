import { NextResponse } from 'next/server';
import { z } from 'zod';

export function handleZodError(error: z.ZodError): NextResponse {
    return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
    );
}

export function handleFetchError(error: unknown, resource: string): NextResponse {
    console.error(`Error fetching ${resource}:`, error);
    return NextResponse.json(
        { error: `Failed to fetch ${resource}` },
        { status: 500 }
    );
}

export function validateLimit(limit: number, maxLimit: number, resource: string): NextResponse | null {
    if (limit > maxLimit) {
        return NextResponse.json(
            { error: `Limit cannot exceed ${maxLimit} for ${resource}` },
            { status: 400 }
        );
    }
    return null;
}

const querySchema = z.object({
    dataroomId: z.string(),
    viewerId: z.string(),
    linkId: z.string(),
    limit: z.coerce.number().min(1).max(100).optional(),
    cursor: z.string().optional(),
});

export function extractAndValidateQueryParams(req: Request) {
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    return querySchema.parse(params);
}
