export enum RAGErrorCode {
    // Core RAG Errors
    VECTOR_SEARCH_FAILED = 'VECTOR_SEARCH_FAILED',
    RESPONSE_GENERATION_FAILED = 'RESPONSE_GENERATION_FAILED',

    // Infrastructure Errors
    LLM_CALL_FAILED = 'LLM_CALL_FAILED',

    // Configuration Errors
    INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',

    // Token Management Errors
    TOKEN_LIMIT_EXCEEDED = 'TOKEN_LIMIT_EXCEEDED',

    // Unknown Error
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface RAGErrorContext {
    service?: string;
    operation?: string;
    query?: string;
    dataroomId?: string;
    viewerId?: string;
    documentId?: string;
    documentUrl?: string;
    field?: string;
    templateId?: string;
    textLength?: number;
    duration?: number;
    [key: string]: any;
}

export class RAGError extends Error {
    public readonly code: RAGErrorCode;
    public readonly context: RAGErrorContext;
    public readonly isRetryable: boolean;
    public readonly originalError?: Error;

    constructor(
        message: string,
        code: RAGErrorCode = RAGErrorCode.UNKNOWN_ERROR,
        context: RAGErrorContext = {},
        isRetryable: boolean = false,
        originalError?: Error
    ) {
        super(message);
        this.name = 'RAGError';
        this.code = code;
        this.context = context;
        this.isRetryable = isRetryable;
        this.originalError = originalError;
    }

    /**
     * Create error dynamically based on type and context
     */
    static create(
        type: string,
        message?: string,
        context: RAGErrorContext = {},
        originalError?: Error
    ): RAGError {
        const errorConfigs: Record<string, {
            code: RAGErrorCode;
            defaultMessage: string;
            isRetryable: boolean;
        }> = {
            // Search
            'vectorSearch': {
                code: RAGErrorCode.VECTOR_SEARCH_FAILED,
                defaultMessage: 'Vector search failed',
                isRetryable: true
            },
            // Processing
            'responseGeneration': {
                code: RAGErrorCode.RESPONSE_GENERATION_FAILED,
                defaultMessage: 'Response generation failed',
                isRetryable: true
            },
            'chunking': {
                code: RAGErrorCode.INVALID_CONFIGURATION,
                defaultMessage: 'Chunking failed',
                isRetryable: false
            },

            // Infrastructure
            'llmCall': {
                code: RAGErrorCode.LLM_CALL_FAILED,
                defaultMessage: 'LLM call failed',
                isRetryable: true
            },
            'embedding': {
                code: RAGErrorCode.LLM_CALL_FAILED,
                defaultMessage: 'Embedding generation failed',
                isRetryable: true
            },
            'vectorDatabase': {
                code: RAGErrorCode.INVALID_CONFIGURATION,
                defaultMessage: 'Vector database operation failed',
                isRetryable: true
            },

            // Auth & Permissions
            'documentAccess': {
                code: RAGErrorCode.INVALID_CONFIGURATION,
                defaultMessage: 'Document access denied',
                isRetryable: false
            },

            // Configuration
            'validation': {
                code: RAGErrorCode.INVALID_CONFIGURATION,
                defaultMessage: 'Validation failed',
                isRetryable: false
            },
            'serviceDisposed': {
                code: RAGErrorCode.INVALID_CONFIGURATION,
                defaultMessage: 'Service has been disposed',
                isRetryable: false
            },
            'requestValidation': {
                code: RAGErrorCode.INVALID_CONFIGURATION,
                defaultMessage: 'Request validation failed',
                isRetryable: false
            },
            'missingConfiguration': {
                code: RAGErrorCode.INVALID_CONFIGURATION,
                defaultMessage: 'Missing required configuration',
                isRetryable: false
            },
            'tokenLimitExceeded': {
                code: RAGErrorCode.TOKEN_LIMIT_EXCEEDED,
                defaultMessage: 'Token limit exceeded for this chat session',
                isRetryable: false
            }
        };

        const config = errorConfigs[type] || {
            code: RAGErrorCode.UNKNOWN_ERROR,
            defaultMessage: 'Unknown error occurred',
            isRetryable: false
        };

        return new RAGError(
            message || config.defaultMessage,
            config.code,
            context,
            config.isRetryable,
            originalError
        );
    }

    /**
     * Log error with context
     */
    log(): void {
        console.error(`[RAG Error] ${this.code}: ${this.message}`, {
            context: this.context,
            isRetryable: this.isRetryable,
            originalError: this.originalError?.message
        });
    }

    /**
     * Wrap async operations with error handling
     */
    static async withErrorHandling<T>(
        operation: () => Promise<T>,
        errorType: string,
        context: RAGErrorContext = {}
    ): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            const ragError = RAGError.create(
                errorType,
                undefined,
                context,
                error instanceof Error ? error : new Error(String(error))
            );
            ragError.log();
            throw ragError;
        }
    }

    /**
     * Utility function to extract error message from any error type
     */
    static getErrorMessage(error: unknown): string {
        if (error instanceof RAGError) {
            return error.message;
        }
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === 'string') {
            return error;
        }
        return 'An unknown error occurred';
    }
}

export const getErrorMessage = RAGError.getErrorMessage;
