import { ChatMessageMetadata } from "./chat-storage.service";

export interface PerformanceMetrics {
    queryAnalysisStart?: number;
    queryAnalysisEnd?: number;
    searchStart?: number;
    searchEnd?: number;
    responseStart?: number;
    responseEnd?: number;
    totalStart?: number;
    totalEnd?: number;
}

export interface TokenUsage {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
}

export interface SearchResults {
    chunkIds?: string[];
    documentIds?: string[];
    pageRanges?: string[];
}

export class ChatMetadataTracker {
    private metadata: Partial<ChatMessageMetadata> = {};
    private performanceMetrics: PerformanceMetrics = {};
    private tokenUsage: TokenUsage = {};
    private searchResults: SearchResults = {};

    startQueryAnalysis(): void {
        this.performanceMetrics.queryAnalysisStart = Date.now();
    }


    endQueryAnalysis(): void {
        if (this.performanceMetrics.queryAnalysisStart) {
            this.performanceMetrics.queryAnalysisEnd = Date.now();
            this.metadata.queryAnalysisTime =
                this.performanceMetrics.queryAnalysisEnd - this.performanceMetrics.queryAnalysisStart;
        }
    }


    startSearch(): void {
        this.performanceMetrics.searchStart = Date.now();
    }


    endSearch(): void {
        if (this.performanceMetrics.searchStart) {
            this.performanceMetrics.searchEnd = Date.now();
            this.metadata.searchTime =
                this.performanceMetrics.searchEnd - this.performanceMetrics.searchStart;
        }
    }


    startResponse(): void {
        this.performanceMetrics.responseStart = Date.now();
    }

    endResponse(): void {
        if (this.performanceMetrics.responseStart) {
            this.performanceMetrics.responseEnd = Date.now();
            this.metadata.responseTime =
                this.performanceMetrics.responseEnd - this.performanceMetrics.responseStart;
        }
    }


    startTotal(): void {
        this.performanceMetrics.totalStart = Date.now();
    }


    endTotal(): void {
        if (this.performanceMetrics.totalStart) {
            this.performanceMetrics.totalEnd = Date.now();
            this.metadata.totalTime =
                this.performanceMetrics.totalEnd - this.performanceMetrics.totalStart;
        }
    }

    setQueryAnalysis(data: {
        queryType?: string;
        intent?: string;
        complexityLevel?: string;
    }): void {
        this.metadata.queryType = data.queryType;
        this.metadata.intent = data.intent;
        this.metadata.complexityLevel = data.complexityLevel;
    }

    setSearchStrategy(data: {
        strategy?: string;
        confidence?: number;
    }): void {
        this.metadata.searchStrategy = data.strategy;
        this.metadata.strategyConfidence = data.confidence;
    }

    setTokenUsage(data: TokenUsage): void {
        this.tokenUsage.inputTokens = (this.tokenUsage.inputTokens || 0) + (data.inputTokens || 0);
        this.tokenUsage.outputTokens = (this.tokenUsage.outputTokens || 0) + (data.outputTokens || 0);
        this.tokenUsage.totalTokens = (this.tokenUsage.totalTokens || 0) + (data.totalTokens || 0);

        // Store in metadata
        this.metadata.inputTokens = this.tokenUsage.inputTokens;
        this.metadata.outputTokens = this.tokenUsage.outputTokens;
        this.metadata.totalTokens = this.tokenUsage.totalTokens;
    }
    /**
     * Add search results
     */
    addSearchResults(data: SearchResults): void {
        this.searchResults = { ...this.searchResults, ...data };
        this.metadata.chunkIds = this.searchResults.chunkIds;
        this.metadata.documentIds = this.searchResults.documentIds;
        this.metadata.pageRanges = this.searchResults.pageRanges;
    }

    setContextCompression(data: {
        strategy?: string;
        originalSize?: number;
        compressedSize?: number;
    }): void {
        this.metadata.compressionStrategy = data.strategy;
        this.metadata.originalContextSize = data.originalSize;
        this.metadata.compressedContextSize = data.compressedSize;
    }


    setError(data: {
        type?: string;
        message?: string;
        isRetryable?: boolean;
    }): void {
        this.metadata.errorType = data.type;
        this.metadata.errorMessage = data.message;
        this.metadata.isRetryable = data.isRetryable;
    }

    getMetadata(): ChatMessageMetadata {
        return { ...this.metadata };
    }

    reset(): void {
        this.metadata = {};
        this.performanceMetrics = {};
        this.tokenUsage = {};
        this.searchResults = {};
    }


    static create(): ChatMetadataTracker {
        return new ChatMetadataTracker();
    }
}
