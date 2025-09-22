import { ChatMessageMetadata } from "./chat-storage.service";
import { TokenUsage } from "../types/rag-types";

export interface PerformanceMetrics {
    queryAnalysisStart?: number;
    queryAnalysisEnd?: number;
    searchStart?: number;
    searchEnd?: number;
    totalStart?: number;
    totalEnd?: number;
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
        complexityScore?: number;
    }): void {
        this.metadata.queryType = data.queryType;
        this.metadata.intent = data.intent;
        this.metadata.complexityLevel = data.complexityLevel;
        this.metadata.complexityScore = data.complexityScore;
    }

    setSearchStrategy(data: {
        strategy?: string;
        confidence?: number;
        reasoning?: string;
    }): void {
        this.metadata.searchStrategy = data.strategy;
        this.metadata.strategyConfidence = data.confidence;
        this.metadata.strategyReasoning = data.reasoning;
    }

    setTokenUsage(data: TokenUsage & {
        contextTokens?: number;
        queryTokens?: number;
    }): void {
        this.tokenUsage.inputTokens = (this.tokenUsage.inputTokens || 0) + (data.inputTokens || 0);
        this.tokenUsage.outputTokens = (this.tokenUsage.outputTokens || 0) + (data.outputTokens || 0);
        this.tokenUsage.totalTokens = (this.tokenUsage.totalTokens || 0) + (data.totalTokens || 0);

        // Store in metadata
        this.metadata.inputTokens = this.tokenUsage.inputTokens;
        this.metadata.outputTokens = this.tokenUsage.outputTokens;
        this.metadata.totalTokens = this.tokenUsage.totalTokens;
        this.metadata.contextTokens = data.contextTokens;
        this.metadata.queryTokens = data.queryTokens;
    }
    /**
     * Add search results
     */
    addSearchResults(data: SearchResults & {
        totalSearchResults?: number;
        allocatedChunks?: number;
        avgRelevanceScore?: number;
    }): void {
        this.searchResults = { ...this.searchResults, ...data };
        this.metadata.chunkIds = this.searchResults.chunkIds;
        this.metadata.documentIds = this.searchResults.documentIds;
        this.metadata.pageRanges = this.searchResults.pageRanges;
        this.metadata.totalSearchResults = data.totalSearchResults;
        this.metadata.allocatedChunks = data.allocatedChunks;
        this.metadata.avgRelevanceScore = data.avgRelevanceScore;
    }

    setContextCompression(data: {
        strategy?: string;
        originalSize?: number;
        compressedSize?: number;
        efficiency?: number;
    }): void {
        this.metadata.compressionStrategy = data.strategy;
        this.metadata.originalContextSize = data.originalSize;
        this.metadata.compressedContextSize = data.compressedSize;
        this.metadata.contextEfficiency = data.efficiency;
    }

    setReranking(data: {
        wasReranked?: boolean;
        threshold?: number;
        inputCount?: number;
        outputCount?: number;
        rerankTime?: number;
    }): void {
        this.metadata.wasReranked = data.wasReranked;
        this.metadata.rerankThreshold = data.threshold;
        this.metadata.rerankInputCount = data.inputCount;
        this.metadata.rerankOutputCount = data.outputCount;
        this.metadata.rerankTime = data.rerankTime;
    }

    setGenerationConfig(data: {
        modelUsed?: string;
        temperature?: number;
        toolsEnabled?: boolean;
    }): void {
        this.metadata.modelUsed = data.modelUsed;
        this.metadata.temperature = data.temperature;
        this.metadata.toolsEnabled = data.toolsEnabled;
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

    static create(): ChatMetadataTracker {
        return new ChatMetadataTracker();
    }
}
