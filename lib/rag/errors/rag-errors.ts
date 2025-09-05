export enum RAGErrorCode {
    // Core RAG Errors
    QUERY_SANITIZATION_FAILED = 'QUERY_SANITIZATION_FAILED',
    QUERY_ANALYSIS_FAILED = 'QUERY_ANALYSIS_FAILED',
    VECTOR_SEARCH_FAILED = 'VECTOR_SEARCH_FAILED',
    NO_SEARCH_RESULTS = 'NO_SEARCH_RESULTS',
    GRADING_FAILED = 'GRADING_FAILED',
    NO_RELEVANT_DOCUMENTS = 'NO_RELEVANT_DOCUMENTS',
    RESPONSE_GENERATION_FAILED = 'RESPONSE_GENERATION_FAILED',

    // Infrastructure Errors
    LLM_CALL_FAILED = 'LLM_CALL_FAILED',
    TIMEOUT_ERROR = 'TIMEOUT_ERROR',
    DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

    // Configuration Errors
    INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
    MISSING_REQUIRED_CONFIG = 'MISSING_REQUIRED_CONFIG',

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
            // Query Analysis
            'querySanitization': {
                code: RAGErrorCode.QUERY_SANITIZATION_FAILED,
                defaultMessage: 'Query sanitization failed',
                isRetryable: true
            },
            'queryAnalysis': {
                code: RAGErrorCode.QUERY_ANALYSIS_FAILED,
                defaultMessage: 'Query analysis failed',
                isRetryable: true
            },
            'queryRouting': {
                code: RAGErrorCode.QUERY_ANALYSIS_FAILED,
                defaultMessage: 'Query routing failed',
                isRetryable: true
            },

            // Search
            'vectorSearch': {
                code: RAGErrorCode.VECTOR_SEARCH_FAILED,
                defaultMessage: 'Vector search failed',
                isRetryable: true
            },
            'noSearchResults': {
                code: RAGErrorCode.NO_SEARCH_RESULTS,
                defaultMessage: 'No search results found',
                isRetryable: false
            },
            'noRelevantDocuments': {
                code: RAGErrorCode.NO_RELEVANT_DOCUMENTS,
                defaultMessage: 'No relevant documents found',
                isRetryable: false
            },

            // Processing
            'grading': {
                code: RAGErrorCode.GRADING_FAILED,
                defaultMessage: 'Document grading failed',
                isRetryable: true
            },
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
            'documentProcessing': {
                code: RAGErrorCode.INVALID_CONFIGURATION,
                defaultMessage: 'Document processing failed',
                isRetryable: true
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
            'timeout': {
                code: RAGErrorCode.TIMEOUT_ERROR,
                defaultMessage: 'Operation timed out',
                isRetryable: true
            },
            'database': {
                code: RAGErrorCode.DATABASE_CONNECTION_FAILED,
                defaultMessage: 'Database operation failed',
                isRetryable: true
            },
            'vectorDatabase': {
                code: RAGErrorCode.DATABASE_CONNECTION_FAILED,
                defaultMessage: 'Vector database operation failed',
                isRetryable: true
            },

            // Auth & Permissions
            'permissionDenied': {
                code: RAGErrorCode.PERMISSION_DENIED,
                defaultMessage: 'Permission denied',
                isRetryable: false
            },
            'authentication': {
                code: RAGErrorCode.PERMISSION_DENIED,
                defaultMessage: 'Authentication failed',
                isRetryable: false
            },
            'documentAccess': {
                code: RAGErrorCode.PERMISSION_DENIED,
                defaultMessage: 'Document access denied',
                isRetryable: false
            },
            'rateLimit': {
                code: RAGErrorCode.RATE_LIMIT_EXCEEDED,
                defaultMessage: 'Rate limit exceeded',
                isRetryable: true
            },

            // Configuration
            'validation': {
                code: RAGErrorCode.INVALID_CONFIGURATION,
                defaultMessage: 'Validation failed',
                isRetryable: false
            },
            'missingConfig': {
                code: RAGErrorCode.MISSING_REQUIRED_CONFIG,
                defaultMessage: 'Missing required configuration',
                isRetryable: false
            },
            'templateNotFound': {
                code: RAGErrorCode.INVALID_CONFIGURATION,
                defaultMessage: 'Template not found',
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
                code: RAGErrorCode.MISSING_REQUIRED_CONFIG,
                defaultMessage: 'Missing required configuration',
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
