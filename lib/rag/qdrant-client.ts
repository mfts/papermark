import { QdrantClient } from "@qdrant/js-client-rest";

import { RAGError } from "./errors";

const QDRANT_CONFIG = {
    DEFAULT_VECTOR_SIZE: 1536,
    DEFAULT_DISTANCE: "Cosine",
    DEFAULT_SCORE_THRESHOLD: 0.7,
    DEFAULT_LIMIT: 10,
    OPERATION_TIMEOUT_MS: 20000,
} as const;

// Types for Qdrant operations
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

// Qdrant client wrapper
export class QdrantVectorStore {
    private client: QdrantClient;
    private defaultDistance: string = QDRANT_CONFIG.DEFAULT_DISTANCE;

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
        vectorSize: number = QDRANT_CONFIG.DEFAULT_VECTOR_SIZE,
        distance?: string,
    ): Promise<boolean> {
        try {
            const distanceToUse = distance || this.defaultDistance;

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
                    console.warn(`Failed to create indexes for existing collection ${collectionName}:`, indexError);
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
                    console.log(`✅ Created index for field: ${indexField.field_name}`);
                } catch (fieldError) {
                    if (fieldError instanceof Error && fieldError.message.includes("already exists")) {
                        console.log(`ℹ️ Index already exists for field: ${indexField.field_name}`);
                    } else {
                        console.warn(`⚠️ Failed to create index for field ${indexField.field_name}:`, fieldError);
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

    /**
     * Upsert points to collection with batch processing
     */
    async upsertPoints(
        collectionName: string,
        points: QdrantPoint[],
        concurrency: number = 3, // Allow configurable concurrency
    ): Promise<boolean> {
        try {
            const BATCH_SIZE = 100; // Qdrant recommended batch size
            const totalPoints = points.length;

            // Validate points structure
            if (totalPoints === 0) {
                console.warn("No points to upsert", { collectionName });
                return true;
            }

            // Validate first point structure
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

            console.info("Starting batch upsert to Qdrant", {
                collectionName,
                totalPointCount: totalPoints,
                batchSize: BATCH_SIZE,
                concurrency,
                samplePointId: points[0]?.id,
                sampleVectorLength: points[0]?.vector?.length,
            });

            // Create batches
            const batches: QdrantPoint[][] = [];
            for (let i = 0; i < totalPoints; i += BATCH_SIZE) {
                batches.push(points.slice(i, i + BATCH_SIZE));
            }

            // Process batches with controlled concurrency
            const totalBatches = batches.length;

            const settled = await Promise.allSettled(
                batches.map(async (batch, index) => {
                    const batchNumber = index + 1;

                    const upsertData = batch.map((point) => {
                        const payloadSize = JSON.stringify(point.payload).length;
                        if (payloadSize > 64000) {
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

                    console.info(
                        `Upserting batch ${batchNumber}/${totalBatches} to Qdrant`,
                        {
                            collectionName,
                            batchSize: batch.length,
                            batchNumber,
                            totalBatches,
                        },
                    );

                    await this.client.upsert(collectionName, {
                        points: upsertData,
                        wait: true,
                    });

                    console.info(
                        `Successfully upserted batch ${batchNumber}/${totalBatches}`,
                        {
                            collectionName,
                            batchSize: batch.length,
                            batchNumber,
                            totalBatches,
                        },
                    );

                    return { batchNumber, batchSize: batch.length };
                }),
            );

            // Check for any failed batches
            const failedBatches = settled.filter((s) => s.status === "rejected");
            if (failedBatches.length > 0) {
                const errors = failedBatches.map((s) => s.reason);
                console.error("Some batches failed to upsert", {
                    collectionName,
                    failedCount: failedBatches.length,
                    totalBatches,
                    errors: errors.map((e) =>
                        e instanceof Error ? e.message : String(e),
                    ),
                });
                throw RAGError.create(
                    "vectorDatabase",
                    `Failed to upsert ${failedBatches.length} out of ${totalBatches} batches`,
                    { operation: "batchUpsert" },
                    new Error(
                        `Failed to upsert ${failedBatches.length} out of ${totalBatches} batches`,
                    ),
                );
            }

            console.info("Successfully completed all batch upserts to Qdrant", {
                collectionName,
                totalPointCount: totalPoints,
                totalBatches,
            });

            return true;
        } catch (error) {
            console.error("Error upserting points to Qdrant", {
                error: error instanceof Error ? error.message : String(error),
                collectionName,
                pointCount: points.length,
                samplePointId: points[0]?.id,
                sampleVectorLength: points[0]?.vector?.length,
                stack: error instanceof Error ? error.stack : undefined,
            });

            return false;
        }
    }

    /**
     * Delete points from collection
     */
    async deletePoints(
        collectionName: string,
        pointIds: string[],
    ): Promise<boolean> {
        try {
            await this.client.delete(collectionName, {
                points: pointIds,
                wait: true,
            });

            return true;
        } catch (error) {
            console.error("Failed to delete points", { error });
            return false;
        }
    }

    /**
     * Delete entire collection
     */
    async deleteCollection(collectionName: string): Promise<boolean> {
        try {
            await this.client.deleteCollection(collectionName);
            return true;
        } catch (error) {
            console.error("Failed to delete collection", { error });
            return false;
        }
    }

    async searchSimilar(
        collectionName: string,
        vector: number[],
        limit: number = QDRANT_CONFIG.DEFAULT_LIMIT,
        scoreThreshold: number = QDRANT_CONFIG.DEFAULT_SCORE_THRESHOLD,
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
                        new Promise<never>((_, reject) =>
                            setTimeout(
                                () =>
                                    reject(
                                        new Error(
                                            `Qdrant search timeout after ${QDRANT_CONFIG.OPERATION_TIMEOUT_MS}ms`,
                                        ),
                                    ),
                                QDRANT_CONFIG.OPERATION_TIMEOUT_MS,
                            ),
                        ),
                    ]);
                } catch (error) {
                    console.error("❌ Qdrant search failed:", error);

                    if (filterConditions.length > 0) {
                        console.log(
                            "⚠️ Search with metadata filter failed, trying without filter...",
                        );
                        const fallbackRequest = {
                            vector,
                            limit,
                            score_threshold: scoreThreshold,
                            with_payload: true,
                        };

                        try {
                            results = await Promise.race([
                                this.client.search(collectionName, fallbackRequest),
                                new Promise<never>((_, reject) =>
                                    setTimeout(
                                        () =>
                                            reject(
                                                new Error(
                                                    `Qdrant search timeout after ${QDRANT_CONFIG.OPERATION_TIMEOUT_MS}ms`,
                                                ),
                                            ),
                                        QDRANT_CONFIG.OPERATION_TIMEOUT_MS,
                                    ),
                                ),
                            ]);
                            // Fallback search succeeded
                        } catch (fallbackError) {
                            console.error("❌ Fallback search also failed:", fallbackError);
                            throw new Error(
                                `Qdrant search failed with and without metadata filter: ${error instanceof Error ? error.message : "Unknown error"}`,
                            );
                        }
                    } else {
                        throw error;
                    }
                }

                return results.map((result) => {
                    return {
                        id: String(result.id),
                        score: result.score,
                        payload: {
                            documentId: String(result.payload?.documentId || ""),
                            content: String(result.payload?.content || ""),
                            metadata: {
                                pageRanges: result.payload?.pageRanges || [],
                                chunkIndex: result.payload?.chunkIndex || 0,
                                sectionHeader: result.payload?.sectionHeader || '',
                                documentName: result.payload?.documentName || '',
                                tokenCount: result.payload?.tokenCount || 0,
                                contentType: result.payload?.contentType || '',
                                dataroomId: result.payload?.dataroomId || '',
                                teamId: result.payload?.teamId || '',
                                chunkId: result.payload?.chunkId || '',
                                createdAt: result.payload?.createdAt || '',
                                headerHierarchy: result.payload?.headerHierarchy || [],
                                isSmallChunk: result.payload?.isSmallChunk || false,
                                startLine: result.payload?.startLine || 0,
                                endLine: result.payload?.endLine || 0
                            },
                        },
                    };
                });
            },
            "qdrantSearch",
            {
                service: "QdrantVectorStore",
                operation: "searchSimilar",
                collectionName,
            },
        );
    }

    /**
     * Validate search input parameters
     */
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

    /**
     * Build filter conditions with validation
     */
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

    async getFilteredPoints(
        collectionName: string,
        filter?: {
            documentId?: string;
            documentIds?: string[];
        },
        limit: number = 10000,
    ): Promise<QdrantSearchResult[]> {
        try {
            // Build Qdrant filter condition
            let qdrantFilter = null;

            if (filter?.documentId) {
                qdrantFilter = {
                    must: [
                        {
                            key: "documentId",
                            match: { value: filter.documentId },
                        },
                    ],
                };
            } else if (filter?.documentIds && filter.documentIds.length > 0) {
                qdrantFilter = {
                    must: [
                        {
                            key: "documentId",
                            match: { any: filter.documentIds },
                        },
                    ],
                };
            }
            const scrollResult = await this.client.scroll(collectionName, {
                filter: qdrantFilter,
                limit,
                with_payload: true,
                with_vector: false,
            });

            return scrollResult.points.map((point) => ({
                id: String(point.id),
                score: 1.0,
                payload: {
                    documentId: String(point.payload?.documentId || ""),
                    content: String(point.payload?.content || ""),
                    metadata: point.payload?.metadata || {},
                },
            }));
        } catch (error) {
            console.error("Failed to get filtered points", { error, filter });
            return [];
        }
    }
    async getAllPoints(
        collectionName: string,
        filter?: {
            documentId?: string;
            documentIds?: string[];
        },
    ): Promise<QdrantSearchResult[]> {
        return this.getFilteredPoints(collectionName, filter);
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
                console.error("No valid filter provided for deletion", { filter });
                return { success: false };
            }

            const result = await this.client.delete(collectionName, {
                filter: qdrantFilter,
            });

            console.error("Deleted points by filter", {
                collectionName,
                filter,
                operation_id: result.operation_id,
            });

            return { success: true, deletedCount: undefined };
        } catch (error) {
            console.error("Failed to delete points by filter", { error, filter });
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
