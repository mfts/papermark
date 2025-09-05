import OpenAI from "openai";
import { openai } from "../openai";
import { calculateTokenCount } from "./utils/chunk-utils";
import pLimit from 'p-limit';
import * as crypto from "crypto";
import { EmbeddingCache } from "./utils/lruCache";
import { getErrorMessage } from "./errors";
import { RAGError } from "./errors";

export interface EmbeddingResult {
    success: boolean;
    embeddings: Array<{
        chunkId: string;
        embedding: number[];
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
    private openai: OpenAI;
    private model: string;
    private batchSize: number;
    private concurrency: number;
    private rateLimitPerMinute: number;
    private lastRequestTime = 0;
    private requestCount = 0;
    private rateLimitWindowStart = Date.now();
    private cache: EmbeddingCache;
    private cacheExpiryMs: number;

    constructor(
        model: string = "text-embedding-3-small",
        batchSize: number = 120,
        rateLimitPerMinute: number = 3000,
        {
            concurrency = 5,
            cacheExpiryMs = 12 * 60 * 60 * 1000, // 12h
        }: {
            concurrency?: number;
            cacheExpiryMs?: number;
        } = {}
    ) {
        this.openai = openai;
        this.model = model;
        this.batchSize = batchSize;
        this.rateLimitPerMinute = rateLimitPerMinute;
        this.concurrency = concurrency;

        this.cacheExpiryMs = cacheExpiryMs;
        this.cache = new EmbeddingCache(5000, this.cacheExpiryMs);
    }


    async generateEmbeddings(chunks: EmbeddingBatch[]): Promise<EmbeddingResult> {
        const startTime = Date.now();
        const results: Array<{ chunkId: string; embedding: number[] }> = [];
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

            const cachedEmbeds: Array<{ chunkId: string; embedding: number[] }> = [];
            const newGroups: Array<{ content: string; chunkIds: string[] }> = [];

            for (const [, g] of groups) {
                const e = await this.getCachedEmbedding(g.content);
                if (e) {
                    for (const id of g.chunkIds) {
                        cachedEmbeds.push({ chunkId: id, embedding: e });
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
                            await this.enforceRateLimit();
                            const requestBatch: EmbeddingBatch[] = batchGroups.map((g) => ({
                                chunkId: g.chunkIds[0],
                                content: g.content,
                                metadata: undefined as any,
                            }));
                            const batchResult = await this.processBatch(requestBatch);
                            this.updateRateLimitTracking();
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
                                results.push({ chunkId: id, embedding: r.embedding });
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
            case "text-embedding-ada-002":
                return 1536;
            default:
                return 1536;
        }
    }

    private preprocessChunks(chunks: EmbeddingBatch[]): EmbeddingBatch[] {
        const valid: EmbeddingBatch[] = [];

        for (const chunk of chunks) {
            const content = chunk.content.trim();
            if (!content) continue;

            // cheap signal checks
            if (content.length < 10) continue;

            const tokens = calculateTokenCount(content);
            if (tokens < 5) continue;

            valid.push({ ...chunk, content });
        }

        return valid;
    }

    private generateContentHash(content: string): string {
        return crypto.createHash("sha256").update(content).digest("hex");
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
        results: Array<{ chunkId: string; embedding: number[] }>;
        totalTokens: number;
    }> {
        const inputs = chunks.map((c) => c.content);

        try {
            const response = await this.openai.embeddings.create({
                model: this.model,
                input: inputs,
                encoding_format: "float",
            });

            if (response.data.length !== inputs.length) {
                throw RAGError.create(
                    'embedding',
                    `OpenAI response length mismatch: expected ${inputs.length}, got ${response.data.length}`,
                    { textLength: inputs.length },
                    new Error(`OpenAI response length mismatch: expected ${inputs.length}, got ${response.data.length}`)
                );
            }

            const totalTokens = response.usage?.total_tokens ?? 0;

            const results = response.data.map((item, idx) => {
                const chunk = chunks[idx];
                if (!chunk) {
                    throw RAGError.create('validation', `No chunk found for index ${idx}`, { field: 'chunk' });
                }
                return {
                    chunkId: chunk.chunkId,
                    embedding: item.embedding,
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

    private async enforceRateLimit(): Promise<void> {
        const now = Date.now();

        if (now - this.rateLimitWindowStart >= 60_000) {
            this.rateLimitWindowStart = now;
            this.requestCount = 0;
        }

        // if at cap, wait until the next window
        if (this.requestCount >= this.rateLimitPerMinute) {
            const waitMs = 60_000 - (now - this.rateLimitWindowStart);
            if (waitMs > 0) {
                await new Promise((r) => setTimeout(r, waitMs));
                this.rateLimitWindowStart = Date.now();
                this.requestCount = 0;
            }
        }

        // minimum spacing between requests within the window
        const minInterval = 60_000 / Math.max(1, this.rateLimitPerMinute);
        const sinceLast = now - this.lastRequestTime;
        if (sinceLast < minInterval) {
            await new Promise((r) => setTimeout(r, minInterval - sinceLast));
        }
    }

    private updateRateLimitTracking(): void {
        this.lastRequestTime = Date.now();
        this.requestCount++;
    }

    public updateCacheTTL(newTTL: number): void {
        this.cacheExpiryMs = newTTL;
    }

    public getCacheTTL(): number {
        return this.cacheExpiryMs;
    }
}
