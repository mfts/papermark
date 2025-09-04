import { logger } from "@trigger.dev/sdk/v3";

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    status?: number;
}

export interface FetchOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
    signal?: AbortSignal;
}

export async function makeApiCall<T = any>(
    url: string,
    options: FetchOptions = {},
    context: Record<string, any> = {}
): Promise<ApiResponse<T>> {
    const {
        method = 'GET',
        headers = {},
        body,
        timeout = 30000,
        signal
    } = options;

    const requestId = Math.random().toString(36).substring(7);

    try {
        logger.debug("Making API call", {
            requestId,
            url,
            method,
            context
        });

        const fetchOptions: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            signal: signal || AbortSignal.timeout(timeout)
        };

        if (body) {
            fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            let errorText = '';
            try {
                errorText = await response.text();
            } catch (textError) {
                errorText = 'Failed to read error response';
            }

            logger.error("API call failed - HTTP error", {
                requestId,
                url,
                method,
                status: response.status,
                statusText: response.statusText,
                errorText,
                context
            });

            return {
                success: false,
                error: `HTTP ${response.status}: ${errorText}`,
                status: response.status
            };
        }

        let data: T;
        try {
            data = await response.json();
        } catch (jsonError) {
            logger.error("API call failed - JSON parse error", {
                requestId,
                url,
                method,
                error: jsonError instanceof Error ? jsonError.message : String(jsonError),
                context
            });

            return {
                success: false,
                error: `JSON parse error: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`
            };
        }

        logger.debug("API call successful", {
            requestId,
            url,
            method,
            context
        });

        return {
            success: true,
            data
        };

    } catch (error) {
        logger.error("API call failed - network error", {
            requestId,
            url,
            method,
            error: error instanceof Error ? error.message : String(error),
            errorType: error instanceof Error ? error.constructor.name : 'Unknown',
            context
        });

        return {
            success: false,
            error: `Network error: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}


export function calculateTimeout(
    documentCount: number,
    options: {
        baseTimeout?: number;
        perDocumentTimeout?: number;
        maxTimeout?: number;
    } = {}
): number {
    const {
        baseTimeout = 300000, // 5 minutes base
        perDocumentTimeout = 220000, // 2.2 minutes per document
        maxTimeout = 1800000 // 30 minutes maximum
    } = options;

    return Math.min(
        baseTimeout + (documentCount * perDocumentTimeout),
        maxTimeout
    );
}

export function calculatePollInterval(
    documentCount: number,
    options: {
        baseInterval?: number;
        perDocumentInterval?: number;
        maxInterval?: number;
    } = {}
): number {
    const {
        baseInterval = 12000, // 12 seconds base
        perDocumentInterval = 5000, // 5 seconds per document
        maxInterval = 60000 // 1 minute maximum
    } = options;

    return Math.min(
        baseInterval + (documentCount * perDocumentInterval),
        maxInterval
    );
}
