import { QdrantClient } from "@qdrant/js-client-rest";
import { logger } from "@trigger.dev/sdk/v3";
import pLimit from 'p-limit';
import { RAGError } from './errors';

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
    private defaultDistance: string = "Cosine";

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
        distance?: string
    ): Promise<boolean> {
        try {
            const distanceToUse = distance || this.defaultDistance;

            await this.client.createCollection(collectionName, {
                vectors: {
                    size: vectorSize,
                    distance: distanceToUse as any,
                },
            });

            return true;
        } catch (error) {
            // Collection might already exist
            if (error instanceof Error && error.message.includes("already exists")) {
                return true;
            }
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
                (collection) => collection.name === collectionName
            );
        } catch (error) {
            return false;
        }
    }

    /**
     * Get collection information
     */
    async getCollectionInfo(collectionName: string): Promise<QdrantCollectionInfo | null> {
        try {
            const info = await this.client.getCollection(collectionName);

            // Handle the complex vectors config structure
            let vectorSize = 1536;
            let distance = 'Cosine';

            if (info.config.params.vectors) {
                const vectors = info.config.params.vectors;
                if (typeof vectors === 'object' && 'size' in vectors) {
                    vectorSize = (vectors as any).size;
                    distance = (vectors as any).distance || 'Cosine';
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
        concurrency: number = 3 // Allow configurable concurrency
    ): Promise<boolean> {
        try {
            const BATCH_SIZE = 100; // Qdrant recommended batch size
            const totalPoints = points.length;

            // Validate points structure
            if (totalPoints === 0) {
                logger.warn('No points to upsert', { collectionName });
                return true;
            }

            // Validate first point structure
            const firstPoint = points[0];
            if (!firstPoint.id || !firstPoint.vector || !firstPoint.payload) {
                throw RAGError.create('validation', 'Invalid point structure: missing id, vector, or payload', { field: 'point' });
            }

            if (!Array.isArray(firstPoint.vector) || firstPoint.vector.length === 0) {
                throw RAGError.create('validation', 'Invalid vector: must be a non-empty array', { field: 'vector' });
            }

            logger.info('Starting batch upsert to Qdrant', {
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
            const limit = pLimit(concurrency);
            const totalBatches = batches.length;

            const settled = await Promise.allSettled(
                batches.map((batch, index) =>
                    limit(async () => {
                        const batchNumber = index + 1;

                        const upsertData = batch.map((point) => {
                            // Validate payload size (Qdrant has limits)
                            const payloadSize = JSON.stringify(point.payload).length;
                            if (payloadSize > 64000) { // Qdrant payload limit is 64KB
                                logger.warn('Large payload detected', {
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

                        logger.info(`Upserting batch ${batchNumber}/${totalBatches} to Qdrant`, {
                            collectionName,
                            batchSize: batch.length,
                            batchNumber,
                            totalBatches,
                        });

                        await this.client.upsert(collectionName, {
                            points: upsertData,
                            wait: true,
                        });

                        logger.info(`Successfully upserted batch ${batchNumber}/${totalBatches}`, {
                            collectionName,
                            batchSize: batch.length,
                            batchNumber,
                            totalBatches,
                        });

                        return { batchNumber, batchSize: batch.length };
                    })
                )
            );

            // Check for any failed batches
            const failedBatches = settled.filter(s => s.status === 'rejected');
            if (failedBatches.length > 0) {
                const errors = failedBatches.map(s => s.reason);
                logger.error('Some batches failed to upsert', {
                    collectionName,
                    failedCount: failedBatches.length,
                    totalBatches,
                    errors: errors.map(e => e instanceof Error ? e.message : String(e)),
                });
                throw RAGError.create('vectorDatabase', `Failed to upsert ${failedBatches.length} out of ${totalBatches} batches`, { operation: 'batchUpsert' }, new Error(`Failed to upsert ${failedBatches.length} out of ${totalBatches} batches`));
            }

            logger.info('Successfully completed all batch upserts to Qdrant', {
                collectionName,
                totalPointCount: totalPoints,
                totalBatches,
            });

            return true;
        } catch (error) {
            logger.error('Error upserting points to Qdrant', {
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
        pointIds: string[]
    ): Promise<boolean> {
        try {
            await this.client.delete(collectionName, {
                points: pointIds,
                wait: true,
            });

            return true;
        } catch (error) {
            logger.log('Failed to delete points', { error });
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
            logger.log('Failed to delete collection', { error });
            return false;
        }
    }

    /**
 * Search for similar vectors
 */
    async searchSimilar(
        collectionName: string,
        vector: number[],
        limit: number = 10,
        scoreThreshold: number = 0.7
    ): Promise<QdrantSearchResult[]> {
        try {
            const results = await this.client.search(collectionName, {
                vector,
                limit,
                score_threshold: scoreThreshold,
                with_payload: true,
            });



            return results.map((result) => ({
                id: String(result.id),
                score: result.score,
                payload: {
                    documentId: String(result.payload?.documentId || ''),
                    content: String(result.payload?.content || ''),
                    metadata: result.payload?.metadata || {}
                },
            }));
        } catch (error) {
            logger.log('Failed to search vectors', { error });
            return [];
        }
    }



    async getFilteredPoints(
        collectionName: string,
        filter?: {
            documentId?: string;
            documentIds?: string[];
        },
        limit: number = 10000
    ): Promise<QdrantSearchResult[]> {
        try {
            // Build Qdrant filter condition
            let qdrantFilter = null;

            if (filter?.documentId) {
                qdrantFilter = {
                    must: [{
                        key: "documentId",
                        match: { value: filter.documentId }
                    }]
                };
            } else if (filter?.documentIds && filter.documentIds.length > 0) {
                qdrantFilter = {
                    must: [{
                        key: "documentId",
                        match: { any: filter.documentIds }
                    }]
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
                    documentId: String(point.payload?.documentId || ''),
                    content: String(point.payload?.content || ''),
                    metadata: point.payload?.metadata || {}
                },
            }));
        } catch (error) {
            logger.log('Failed to get filtered points', { error, filter });
            return [];
        }
    }
    async getAllPoints(
        collectionName: string,
        filter?: {
            documentId?: string;
            documentIds?: string[];
        }
    ): Promise<QdrantSearchResult[]> {
        return this.getFilteredPoints(collectionName, filter);
    }
    async deletePointsByFilter(
        collectionName: string,
        filter: {
            documentId?: string;
            documentIds?: string[];
        }
    ): Promise<{ success: boolean; deletedCount?: number }> {
        try {
            let qdrantFilter = null;

            if (filter.documentId) {
                qdrantFilter = {
                    must: [{
                        key: "documentId",
                        match: { value: filter.documentId }
                    }]
                };
            } else if (filter.documentIds && filter.documentIds.length > 0) {
                qdrantFilter = {
                    must: [{
                        key: "documentId",
                        match: { any: filter.documentIds }
                    }]
                };
            }

            if (!qdrantFilter) {
                logger.log('No valid filter provided for deletion', { filter });
                return { success: false };
            }

            const result = await this.client.delete(collectionName, {
                filter: qdrantFilter,
            });

            logger.log('Deleted points by filter', {
                collectionName,
                filter,
                operation_id: result.operation_id
            });

            return { success: true, deletedCount: undefined }; 
        } catch (error) {
            logger.log('Failed to delete points by filter', { error, filter });
            return { success: false };
        }
    }

    async bulkDeleteDocumentVectors(
        collectionName: string,
        documentIds: string[]
    ): Promise<{ success: boolean; deletedCount?: number }> {
        if (documentIds.length === 0) {
            return { success: true, deletedCount: 0 };
        }

        if (documentIds.length === 1) {
            return this.deletePointsByFilter(collectionName, {
                documentId: documentIds[0]
            });
        }

        return this.deletePointsByFilter(collectionName, {
            documentIds
        });
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<boolean> {
        try {
            await this.client.getCollections();
            return true;
        } catch (error) {
            return false;
        }
    }
}
