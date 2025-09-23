import { embed } from "ai";
import { openai } from "../openai";
import { calculateTokenCount } from "./utils/chunk-utils";
import pLimit from 'p-limit';
import * as crypto from "crypto";
import { EmbeddingCache } from "./utils/lruCache";
import { getErrorMessage } from "./errors/rag-errors";
import { RAGError } from "./errors/rag-errors";
import { logger } from "@trigger.dev/sdk/v3";

export interface EmbeddingResult {
    success: boolean;
    embeddings: Array<{
        chunkId: string;
        embedding: number[];
        tokens?: number;
    }>;
    error?: string;
    processingTime: number;
    totalTokens: number;
    cachedCount: number;
    newCount: number;
}

export interface EmbeddingBatch {
    chunkId: string;
    content: string;
    metadata: any;
}

export class EmbeddingGenerator {
    private model: string;
    private batchSize: number;
    private concurrency: number;
    private cache: EmbeddingCache;
    private cacheExpiryMs: number;

    constructor(
        model: string = "text-embedding-3-small",
        batchSize: number = 120,
        {
            concurrency = 5,
            cacheExpiryMs = 12 * 60 * 60 * 1000, // 12h
        }: {
            concurrency?: number;
            cacheExpiryMs?: number;
        } = {}
    ) {
        this.model = model;
        this.batchSize = batchSize;
        this.concurrency = concurrency;

        this.cacheExpiryMs = cacheExpiryMs;
        this.cache = new EmbeddingCache(this.cacheExpiryMs);
    }


    async generateEmbeddings(chunks: EmbeddingBatch[]): Promise<EmbeddingResult> {
        const startTime = Date.now();
        const results: Array<{ chunkId: string; embedding: number[]; tokens?: number }> = [];
        let totalTokens = 0;
        let cachedCount = 0;
        let newCount = 0;

        try {
            const validChunks = this.preprocessChunks(chunks);
            if (validChunks.length === 0) {
                return {
                    success: true,
                    embeddings: [],
                    processingTime: Date.now() - startTime,
                    totalTokens: 0,
                    cachedCount: 0,
                    newCount: 0,
                };
            }

            const groups = new Map<string, { content: string; chunkIds: string[] }>();
            for (const chunk of validChunks) {
                const key = this.generateContentHash(chunk.content);
                const g = groups.get(key);
                if (g) g.chunkIds.push(chunk.chunkId);
                else groups.set(key, { content: chunk.content, chunkIds: [chunk.chunkId] });
            }

            const cachedEmbeds: Array<{ chunkId: string; embedding: number[]; tokens?: number }> = [];
            const newGroups: Array<{ content: string; chunkIds: string[] }> = [];

            for (const [, g] of groups) {
                const e = await this.getCachedEmbedding(g.content);
                if (e) {
                    for (const id of g.chunkIds) {
                        cachedEmbeds.push({ chunkId: id, embedding: e, tokens: undefined });
                        cachedCount++;
                    }
                } else {
                    newGroups.push(g);
                }
            }

            results.push(...cachedEmbeds);
            if (newGroups.length > 0) {
                const batches: Array<Array<{ content: string; chunkIds: string[] }>> = [];
                for (let i = 0; i < newGroups.length; i += this.batchSize) {
                    batches.push(newGroups.slice(i, i + this.batchSize));
                }

                const limit = pLimit(this.concurrency);

                const settled = await Promise.allSettled(
                    batches.map((batchGroups) =>
                        limit(async () => {
                            const requestBatch: EmbeddingBatch[] = batchGroups.map((g) => ({
                                chunkId: g.chunkIds[0],
                                content: g.content,
                                metadata: undefined as any,
                            }));
                            const batchResult = await this.processBatch(requestBatch);
                            batchResult.results.forEach((r, idx) => {
                                const g = batchGroups[idx];
                                if (g) this.cacheEmbedding(g.content, r.embedding);
                            });

                            return { batchResult, batchGroups };
                        })
                    )
                );

                for (const s of settled) {
                    if (s.status === "fulfilled") {
                        const { batchResult, batchGroups } = s.value;
                        for (let i = 0; i < batchGroups.length; i++) {
                            const r = batchResult.results[i];
                            const g = batchGroups[i];
                            for (const id of g.chunkIds) {
                                results.push({
                                    chunkId: id,
                                    embedding: r.embedding,
                                    tokens: r.tokens
                                });
                            }
                        }
                        totalTokens += batchResult.totalTokens;
                        newCount += batchGroups.reduce((acc, g) => acc + g.chunkIds.length, 0);
                    } else {
                        throw RAGError.create(
                            'embedding',
                            `One or more embedding batches failed: ${s.reason instanceof Error ? s.reason.message : String(s.reason)}`,
                            { batchCount: 0 },
                            new Error(`One or more embedding batches failed: ${s.reason instanceof Error ? s.reason.message : String(s.reason)}`)
                        );
                    }
                }
            }

            return {
                success: true,
                embeddings: results,
                processingTime: Date.now() - startTime,
                totalTokens,
                cachedCount,
                newCount,
            };
        } catch (error) {
            return {
                success: false,
                embeddings: [],
                error: getErrorMessage(error),
                processingTime: Date.now() - startTime,
                totalTokens: 0,
                cachedCount: 0,
                newCount: 0,
            };
        }
    }

    getEmbeddingDimensions(): number {
        switch (this.model) {
            case "text-embedding-3-small":
                return 1536;
            case "text-embedding-3-large":
                return 3072;
            default:
                return 1536;
        }
    }

    private preprocessChunks(chunks: EmbeddingBatch[]): EmbeddingBatch[] {
        const valid: EmbeddingBatch[] = [];
        const MAX_TOKENS_PER_CHUNK = 8000;

        for (const chunk of chunks) {
            const content = chunk.content.trim();
            if (!content) continue;

            if (content.length < 10) continue;

            const tokens = calculateTokenCount(content);
            if (tokens < 5) continue;

            if (tokens > MAX_TOKENS_PER_CHUNK) {
                logger.warn(`Chunk ${chunk.chunkId} exceeds token limit: ${tokens} > ${MAX_TOKENS_PER_CHUNK}, truncating`, {
                    chunkId: chunk.chunkId,
                    originalTokens: tokens,
                    contentLength: content.length
                });

                const truncatedContent = this.truncateToTokenLimit(content, MAX_TOKENS_PER_CHUNK);
                valid.push({ ...chunk, content: truncatedContent });
            } else {
                valid.push({ ...chunk, content });
            }
        }

        return valid;
    }

    private generateContentHash(content: string): string {
        return crypto.createHash("sha256").update(content).digest("hex");
    }

    private truncateToTokenLimit(content: string, maxTokens: number): string {
        let left = 0;
        let right = content.length;
        let bestLength = 0;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const truncated = content.substring(0, mid);
            const tokens = calculateTokenCount(truncated);

            if (tokens <= maxTokens) {
                bestLength = mid;
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        let truncated = content.substring(0, bestLength);
        const lastSpaceIndex = truncated.lastIndexOf(' ');
        if (lastSpaceIndex > bestLength * 0.8) {
            truncated = truncated.substring(0, lastSpaceIndex);
        }

        return truncated.trim();
    }

    private async getCachedEmbedding(content: string): Promise<number[] | null> {
        const key = this.generateContentHash(content);
        const hit = await this.cache.get(key);
        if (!hit) return null;

        return hit.embedding;
    }

    private async cacheEmbedding(content: string, embedding: number[]): Promise<void> {
        const key = this.generateContentHash(content);
        await this.cache.set(key, { embedding, timestamp: Date.now() });
    }

    private async processBatch(chunks: EmbeddingBatch[]): Promise<{
        results: Array<{ chunkId: string; embedding: number[]; tokens?: number }>;
        totalTokens: number;
    }> {
        const inputs = chunks.map((c) => c.content);

        try {
            const embeddings = await Promise.all(
                inputs.map(input =>
                    embed({
                        model: openai.textEmbeddingModel(this.model),
                        value: input,
                        maxRetries: 2,
                    })
                )
            );

            if (embeddings.length !== inputs.length) {
                throw RAGError.create(
                    'embedding',
                    `Embedding response length mismatch: expected ${inputs.length}, got ${embeddings.length}`,
                    { textLength: inputs.length },
                    new Error(`Embedding response length mismatch: expected ${inputs.length}, got ${embeddings.length}`)
                );
            }

            const totalTokens = embeddings.reduce((sum, emb) => sum + ((emb.usage as any)?.totalTokens ?? 0), 0);

            const results = embeddings.map((embedding, idx: number) => {
                const chunk = chunks[idx];
                if (!chunk) {
                    throw RAGError.create('validation', `No chunk found for index ${idx}`, { field: 'chunk' });
                }

                const chunkTokens = this.calculateChunkTokens(chunk.content, totalTokens, inputs);

                return {
                    chunkId: chunk.chunkId,
                    embedding: embedding.embedding,
                    tokens: chunkTokens,
                };
            });

            return { results, totalTokens };
        } catch (err) {
            throw RAGError.create(
                'embedding',
                `Embedding batch failed (${chunks.length} items): ${err instanceof Error ? err.message : String(err)}`,
                { textLength: chunks.length },
                new Error(`Embedding batch failed (${chunks.length} items): ${err instanceof Error ? err.message : String(err)}`)
            );
        }
    }

    private calculateChunkTokens(chunkContent: string, totalTokens: number, allInputs: string[]): number {
        if (totalTokens === 0 || allInputs.length === 0) return 0;
        let totalChars = 0;
        for (const input of allInputs) {
            totalChars += input.length;
        }
        if (totalChars === 0) return 0;
        return Math.round((chunkContent.length / totalChars) * totalTokens);
    }


    public updateCacheTTL(newTTL: number): void {
        this.cacheExpiryMs = newTTL;
    }

    public getCacheTTL(): number {
        return this.cacheExpiryMs;
    }
}
