export interface QueryProcessingResult {
    originalQuery: string;
    finalQueries: string[];
    routingDecision: RoutingDecision;
    phaseResults: PhaseResults;
    metadata?: QueryMetadata;
}

export interface RoutingDecision {
    searchStrategy: 'semantic' | 'keyword' | 'hybrid' | 'structured';
    confidence: number;
    reasoning?: string;
    optimization?: QueryOptimization;
}

export interface QueryOptimization {
    type: 'expand' | 'decompose' | 'abstract' | 'none';
    confidence: number;
    reasoning?: string;
}

export interface PhaseResults {
    phase1: boolean;
    phase2: boolean;
    phase3: boolean;
    phase4: boolean;
    phase5: boolean;
}

export interface QueryMetadata {
    processingTime: number;
    queryComplexity: 'simple' | 'complex';
    deduplicationRemoved: number;
    cacheHit?: boolean;
}
export interface SearchResult {
    chunkId: string;
    documentId: string;
    content: string;
    similarity: number;
    metadata: ChunkMetadata;
}

export interface ChunkMetadata {
    pageRanges: string[];
    sectionHeader?: string;
    chunkIndex: number;
    documentName?: string;
    tokenCount?: number;
    embeddingId?: string;
    contentType?: string;
    dataroomId?: string;
    teamId?: string;
    isSmallChunk?: boolean;
    headerHierarchy?: string[];
    startLine?: number;
    endLine?: number;
}

export interface GradedDocument {
    documentId: string;
    chunkId: string;
    relevanceScore: number;
    confidence: number;
    isRelevant: boolean;
    suggestedWeight: number;
    originalContent: string;
    metadata: ChunkMetadata;
}

export interface LLMOptions {
    temperature?: number;
    model?: string;
    maxTokens?: number;
    timeout?: number;
    retries?: number;
    signal?: AbortSignal;
}

export interface LLMResponse<T = unknown> {
    content: T;
    usage: TokenUsage;
    model: string;
    processingTime: number;
}

export interface TokenUsage {
    inputTokens?: number;
    outputTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
}

export const RAG_CONSTANTS = {
    // Timeouts
    DEFAULT_TIMEOUT: 30000,
    SHORT_TIMEOUT: 20000,
    LONG_TIMEOUT: 60000,

    // Thresholds
    DEFAULT_SIMILARITY_THRESHOLD: 0.75,
    MIN_SIMILARITY_THRESHOLD: 0.5,
    MAX_SIMILARITY_THRESHOLD: 0.9,

    // Confidence levels
    HIGH_CONFIDENCE: 0.8,
    MEDIUM_CONFIDENCE: 0.6,
    LOW_CONFIDENCE: 0.4,

    // Cache settings
    DEFAULT_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
    SHORT_CACHE_TTL: 60 * 1000, // 1 minute
    LONG_CACHE_TTL: 30 * 60 * 1000, // 30 minutes

    // Limits
    MAX_QUERY_LENGTH: 1000,
    MAX_CONTEXT_LENGTH: 6000,
    MAX_DOCUMENTS_TO_GRADE: 10,
    MAX_SEARCH_RESULTS: 20,

    // Retry settings
    DEFAULT_RETRY_ATTEMPTS: 3,
    DEFAULT_RETRY_DELAY: 1000,

    // Batch sizes
    DEFAULT_BATCH_SIZE: 3,
    MAX_BATCH_SIZE: 10,

    // Query complexity thresholds
    SIMPLE_QUERY_LENGTH: 50,
    COMPLEX_QUERY_LENGTH: 200,

    // Performance thresholds
    HIGH_PERFORMANCE_THRESHOLD: 0.8,
    MEDIUM_PERFORMANCE_THRESHOLD: 0.6,
    LOW_PERFORMANCE_THRESHOLD: 0.4
} as const;

export interface Span {
    start: number;
    end: number;
    text: string;
    confidence: number;
}

export interface SentenceSpan {
    sentence: string;
    spans: Span[];
    coverage: number;
}


export interface RerankerConfig {
    enabled: boolean;
    model: string;
    maxTokens: number;
    temperature: number;
    timeout: number;
    fallbackModel?: string;
}

export interface RerankerResult extends SearchResult {
    relevanceScore: number;
    confidence: number;
    rerankedRank: number;
}

export interface CompressionConfig {
    maxTokens: number;
    compressionRatio: number;
    preserveSpans: boolean;
    method: 'ranked' | 'raptor' | 'hybrid';
}

export interface CompressedContext {
    content: string;
    spans: Span[];
    tokenCount: number;
    compressionRatio: number;
    preservedSpans: boolean;
}