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
    DEFAULT_TIMEOUT: 30000,
    MEDIUM_CONFIDENCE: 0.6,
    DEFAULT_RETRY_ATTEMPTS: 3,
} as const;

export interface RerankerConfig {
    enabled: boolean;
    model: string;
    maxTokens: number;
    temperature?: number;
    timeout: number;
    fallbackModel?: string;
}

export interface RerankerResult extends SearchResult {
    relevanceScore: number;
    confidence: number;
    rerankedRank: number;
}