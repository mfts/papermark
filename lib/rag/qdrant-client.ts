import { QdrantClient } from "@qdrant/js-client-rest";
import pLimit from 'p-limit';

import { RAGError } from "./errors/rag-errors";

const QDRANT_CONFIG = {
    OPERATION_TIMEOUT_MS: 20000,
} as const;

export interface QdrantPoint {
    id: string;
    vector: number[];
    payload: {
        documentId: string;
        content: string;
        metadata?: Record<string, any>;
    };
}

export interface QdrantCollectionInfo {
    name: string;
    vectorSize: number;
    distance: string;
    pointsCount: number;
}

export interface QdrantSearchResult {
    id: string;
    score: number;
    payload: {
        documentId: string;
        content: string;
        metadata?: Record<string, any>;
    };
}

export class QdrantVectorStore {
    private client: QdrantClient;

    constructor(url: string, apiKey?: string) {
        this.client = new QdrantClient({
            url,
            apiKey,
        });
    }

    /**
     * Create a collection for a dataroom
     */
    async createCollection(
        collectionName: string,
        vectorSize: number = 1536,
        distance?: string,
    ): Promise<boolean> {
        try {
            const distanceToUse = distance || "Cosine";

            await this.client.createCollection(collectionName, {
                vectors: {
                    size: vectorSize,
                    distance: distanceToUse as any,
                },
            });
            await this.createMetadataIndexes(collectionName);

            return true;
        } catch (error) {
            if (error instanceof Error && error.message.includes("already exists")) {
                try {
                    await this.createMetadataIndexes(collectionName);
                } catch (indexError) {
                    console.log("Index creation failed", indexError)
                }
                return true;
            }
            throw error;
        }
    }

    public async createMetadataIndexes(collectionName: string): Promise<void> {
        try {
            const indexFields = [
                { field_name: "documentId", field_schema: "keyword" as const },
                { field_name: "pageRanges", field_schema: "keyword" as const },
                { field_name: "dataroomId", field_schema: "keyword" as const },
                { field_name: "teamId", field_schema: "keyword" as const },
                { field_name: "contentType", field_schema: "keyword" as const },
                { field_name: "sectionHeader", field_schema: "keyword" as const },
                { field_name: "chunkIndex", field_schema: "integer" as const },
                { field_name: "tokenCount", field_schema: "integer" as const },
                { field_name: "isSmallChunk", field_schema: "bool" as const },
                { field_name: "startLine", field_schema: "integer" as const },
                { field_name: "endLine", field_schema: "integer" as const }
            ];
            for (const indexField of indexFields) {
                try {
                    await this.client.createPayloadIndex(collectionName, indexField);
                } catch (fieldError) {
                    if (fieldError instanceof Error && fieldError.message.includes("already exists")) {
                        continue;
                    }
                }
            }
        } catch (error) {
            console.warn(`⚠️ Failed to create metadata indexes for collection ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Check if collection exists
     */
    async collectionExists(collectionName: string): Promise<boolean> {
        try {
            const collections = await this.client.getCollections();
            return collections.collections.some(
                (collection) => collection.name === collectionName,
            );
        } catch (error) {
            return false;
        }
    }

    /**
     * Get collection information
     */
    async getCollectionInfo(
        collectionName: string,
    ): Promise<QdrantCollectionInfo | null> {
        try {
            const info = await this.client.getCollection(collectionName);

            let vectorSize = 1536;
            let distance = "Cosine";

            if (info.config.params.vectors) {
                const vectors = info.config.params.vectors;
                if (typeof vectors === "object" && "size" in vectors) {
                    vectorSize = (vectors as any).size;
                    distance = (vectors as any).distance || "Cosine";
                }
            }

            return {
                name: collectionName,
                vectorSize,
                distance,
                pointsCount: info.points_count || 0,
            };
        } catch (error) {
            return null;
        }
    }

    async upsertPoints(
        collectionName: string,
        points: QdrantPoint[],
        concurrency: number = 3, 
    ): Promise<boolean> {
        try {
            const BATCH_SIZE = 100;
            const totalPoints = points.length;

            if (totalPoints === 0) {
                return true;
            }

            const firstPoint = points[0];
            if (!firstPoint.id || !firstPoint.vector || !firstPoint.payload) {
                throw RAGError.create(
                    "validation",
                    "Invalid point structure: missing id, vector, or payload",
                    { field: "point" },
                );
            }

            if (!Array.isArray(firstPoint.vector) || firstPoint.vector.length === 0) {
                throw RAGError.create(
                    "validation",
                    "Invalid vector: must be a non-empty array",
                    { field: "vector" },
                );
            }


            // Create batches
            const batches: QdrantPoint[][] = [];
            for (let i = 0; i < totalPoints; i += BATCH_SIZE) {
                batches.push(points.slice(i, i + BATCH_SIZE));
            }

            // Process batches with controlled concurrency
            const totalBatches = batches.length;
            const MAX_CONCURRENT_BATCHES = Math.min(concurrency, 5);
            const limit = pLimit(MAX_CONCURRENT_BATCHES);

            const settled = await Promise.allSettled(
                batches.map((batch, index) =>
                    limit(async () => {
                    const batchNumber = index + 1;

                    const upsertData = batch.map((point) => {
                        const payloadSize = JSON.stringify(point.payload).length;
                        if (payloadSize > 64000 && process.env.NODE_ENV === 'development') {
                            console.warn("Large payload detected", {
                                pointId: point.id,
                                payloadSize,
                                payloadKeys: Object.keys(point.payload),
                            });
                        }

                        return {
                            id: point.id,
                            vector: point.vector,
                            payload: point.payload,
                        };
                    });


                    await this.client.upsert(collectionName, {
                        points: upsertData,
                        wait: true,
                    });


                    return { batchNumber, batchSize: batch.length };
                    })
                ),
            );

            const failedBatches = settled.filter((s) => s.status === "rejected");
            if (failedBatches.length > 0) {
                throw RAGError.create(
                    "vectorDatabase",
                    `Failed to upsert ${failedBatches.length} out of ${totalBatches} batches`,
                    { operation: "batchUpsert" }
                );
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    async deleteCollection(collectionName: string): Promise<boolean> {
        try {
            await this.client.deleteCollection(collectionName);
            return true;
        } catch (error) {
            return false;
        }
    }

    async searchSimilar(
        collectionName: string,
        vector: number[],
        limit: number = 10,
        scoreThreshold: number = 0.3,
        metadataFilter?: {
            documentIds?: string[];
            pageRanges?: string[];
            dataroomId?: string;
        },
    ): Promise<QdrantSearchResult[]> {
        return RAGError.withErrorHandling(
            async () => {
                this.validateSearchInputs(
                    collectionName,
                    vector,
                    limit,
                    scoreThreshold,
                );

                const filterConditions = this.buildFilterConditions(metadataFilter);

                const searchRequest: any = {
                    vector,
                    limit,
                    score_threshold: scoreThreshold,
                    with_payload: true,
                    params: {
                        exact: false,
                        hnsw_ef: 128,
                    }
                };

                if (filterConditions.length > 0) {
                    searchRequest.filter = {
                        must: filterConditions,
                    };
                }
                let results;
                try {
                    results = await Promise.race([
                        this.client.search(collectionName, searchRequest),
                        this.createTimeoutPromise(),
                    ]);
                } catch (error) {
                    if (filterConditions.length > 0) {
                        const fallbackRequest = {
                            vector,
                            limit,
                            score_threshold: scoreThreshold,
                            with_payload: true,
                        };

                        try {
                            results = await Promise.race([
                                this.client.search(collectionName, fallbackRequest),
                                this.createTimeoutPromise(),
                            ]);
                        } catch (fallbackError) {
                            throw new Error(
                                `Qdrant search failed with and without metadata filter: ${error instanceof Error ? error.message : "Unknown error"}`,
                            );
                        }
                    } else {
                        throw error;
                    }
                }

                return results.map((result) => ({
                    id: String(result.id),
                    score: result.score,
                    payload: {
                        documentId: String(result.payload?.documentId || ""),
                        content: String(result.payload?.content || ""),
                        metadata: result.payload || {},
                    },
                }));
            },
            "vectorSearch",
            {
                service: "QdrantVectorStore",
                operation: "searchSimilar",
                collectionName,
            },
        );
    }

    private validateSearchInputs(
        collectionName: string,
        vector: number[],
        limit: number,
        scoreThreshold: number,
    ): void {
        if (!collectionName || collectionName.trim().length === 0) {
            throw RAGError.create("validation", "Collection name cannot be empty", {
                field: "collectionName",
            });
        }
        if (!vector || vector.length === 0) {
            throw RAGError.create("validation", "Vector cannot be empty", {
                field: "vector",
            });
        }
        if (limit <= 0) {
            throw RAGError.create("validation", "Limit must be positive", {
                field: "limit",
                value: limit,
            });
        }
        if (scoreThreshold < 0 || scoreThreshold > 1) {
            throw RAGError.create(
                "validation",
                "Score threshold must be between 0 and 1",
                {
                    field: "scoreThreshold",
                    value: scoreThreshold,
                },
            );
        }
    }

    private createTimeoutPromise(timeoutMs: number = QDRANT_CONFIG.OPERATION_TIMEOUT_MS): Promise<never> {
        return new Promise<never>((_, reject) =>
            setTimeout(
                () => reject(new Error(`Qdrant operation timeout after ${timeoutMs}ms`)),
                timeoutMs
            )
        );
    }

    private buildFilterConditions(metadataFilter?: {
        documentIds?: string[];
        pageRanges?: string[];
        dataroomId?: string;
    }): any[] {
        const filterConditions: any[] = [];

        if (metadataFilter?.dataroomId) {
            filterConditions.push({
                key: "dataroomId",
                match: {
                    value: metadataFilter.dataroomId,
                },
            });
        }

        if (metadataFilter?.documentIds && metadataFilter.documentIds.length > 0) {
            filterConditions.push({
                key: "documentId",
                match: {
                    any: metadataFilter.documentIds,
                },
            });
        }

        if (metadataFilter?.pageRanges && metadataFilter.pageRanges.length > 0) {
            filterConditions.push({
                key: "pageRanges",
                match: {
                    any: metadataFilter.pageRanges,
                },
            });
        }
        return filterConditions;
    }

    async deletePointsByFilter(
        collectionName: string,
        filter: {
            documentId?: string;
            documentIds?: string[];
        },
    ): Promise<{ success: boolean; deletedCount?: number }> {
        try {
            let qdrantFilter = null;

            if (filter.documentId) {
                qdrantFilter = {
                    must: [
                        {
                            key: "documentId",
                            match: { value: filter.documentId },
                        },
                    ],
                };
            } else if (filter.documentIds && filter.documentIds.length > 0) {
                qdrantFilter = {
                    must: [
                        {
                            key: "documentId",
                            match: { any: filter.documentIds },
                        },
                    ],
                };
            }

            if (!qdrantFilter) {
                return { success: false };
            }

            const result = await this.client.delete(collectionName, {
                filter: qdrantFilter,
            });


            return { success: true, deletedCount: undefined };
        } catch (error) {
            return { success: false };
        }
    }

    async bulkDeleteDocumentVectors(
        collectionName: string,
        documentIds: string[],
    ): Promise<{ success: boolean; deletedCount?: number }> {
        if (documentIds.length === 0) {
            return { success: true, deletedCount: 0 };
        }

        if (documentIds.length === 1) {
            return this.deletePointsByFilter(collectionName, {
                documentId: documentIds[0],
            });
        }

        return this.deletePointsByFilter(collectionName, {
            documentIds,
        });
    }


    async healthCheck(): Promise<boolean> {
        try {
            await this.client.getCollections();
            return true;
        } catch (error) {
            return false;
        }
    }
}
