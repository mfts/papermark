import { QdrantVectorStore, QdrantPoint } from './qdrant-client';
import { log } from '@/lib/utils';
import { RAGError } from './errors/rag-errors';

const VECTOR_MANAGER_CONFIG = {
    DEFAULT_RETRY_COUNT: 2,
    OPERATION_TIMEOUT_MS: 20000
} as const;

class VectorManager {
    private static instance: VectorManager;
    private qdrantClient: QdrantVectorStore;

    private constructor() {
        this.qdrantClient = new QdrantVectorStore(
            process.env.QDRANT_URL || "http://localhost:6333",
            process.env.QDRANT_API_KEY
        );
    }

    public static getInstance(): VectorManager {
        if (!VectorManager.instance) {
            VectorManager.instance = new VectorManager();
        }
        return VectorManager.instance;
    }

    /**
     * Get the Qdrant client instance
     */
    public getClient(): QdrantVectorStore {
        return this.qdrantClient;
    }

    /**
     * Generate collection name for a dataroom
     */
    private generateCollectionName(dataroomId: string): string {
        return `dataroom_${dataroomId}`;
    }

    /**
     * Generate point ID for a chunk
     */
    public generatePointId(chunkId: string): string {
        const crypto = require('crypto');
        const hash = crypto.createHash('md5');
        hash.update(chunkId);
        return hash.digest('hex');
    }

    public async deleteDocumentVectors(
        dataroomId: string,
        documentId: string,
        documentName?: string,
        retryCount: number = VECTOR_MANAGER_CONFIG.DEFAULT_RETRY_COUNT
    ): Promise<boolean> {
        return RAGError.withErrorHandling(
            async () => {
                // Input validation
                this.validateDeleteInputs(dataroomId, documentId);

                const startTime = Date.now();
                const collectionName = this.generateCollectionName(dataroomId);

                // Check if collection exists
                const collectionExists = await this.qdrantClient.collectionExists(collectionName);
                if (!collectionExists) {
                    log({
                        message: `Collection ${collectionName} does not exist for dataroom ${dataroomId}`,
                        type: "info",
                    });
                    return true;
                }

                const collectionInfo = await this.qdrantClient.getCollectionInfo(collectionName);
                if (!collectionInfo || collectionInfo.pointsCount === 0) {
                    log({
                        message: `No vectors found for document ${documentName || documentId} in dataroom ${dataroomId}`,
                        type: "info",
                    });
                    return true;
                }

                // Execute deletion with timeout protection
                const deleteResult = await Promise.race([
                    this.qdrantClient.deletePointsByFilter(collectionName, {
                        documentId: documentId
                    }),
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error(`Delete operation timeout after ${VECTOR_MANAGER_CONFIG.OPERATION_TIMEOUT_MS}ms`)),
                            VECTOR_MANAGER_CONFIG.OPERATION_TIMEOUT_MS)
                    )
                ]);

                if (deleteResult.success) {
                    const duration = Date.now() - startTime;
                    log({
                        message: `Successfully deleted vectors for document ${documentName || documentId} in dataroom ${dataroomId} (${duration}ms)`,
                        type: "info",
                    });
                    return true;
                } else {
                    throw new Error('Filter-based deletion failed');
                }
            },
            'vectorDeletion',
            { service: 'VectorManager', operation: 'deleteDocumentVectors', dataroomId, documentId }
        );
    }

    /**
     * Validate delete operation inputs
     */
    private validateDeleteInputs(dataroomId: string, documentId: string): void {
        if (!dataroomId || dataroomId.trim().length === 0) {
            throw RAGError.create('validation', 'Dataroom ID cannot be empty', { field: 'dataroomId' });
        }
        if (!documentId || documentId.trim().length === 0) {
            throw RAGError.create('validation', 'Document ID cannot be empty', { field: 'documentId' });
        }
    }

    /**
     * Delete all vectors for a dataroom
     */
    public async deleteDataroomVectors(dataroomId: string): Promise<boolean> {
        try {
            const collectionName = this.generateCollectionName(dataroomId);

            // Check if collection exists
            const collectionExists = await this.qdrantClient.collectionExists(collectionName);
            if (!collectionExists) {
                log({
                    message: `Collection ${collectionName} does not exist for dataroom ${dataroomId}`,
                    type: "info",
                });
                return true;
            }

            // Get collection info
            const collectionInfo = await this.qdrantClient.getCollectionInfo(collectionName);
            if (!collectionInfo || collectionInfo.pointsCount === 0) {
                log({
                    message: `No vectors found for dataroom ${dataroomId}`,
                    type: "info",
                });
                return true;
            }

            const deleteSuccess = await this.qdrantClient.deleteCollection(collectionName);

            if (deleteSuccess) {
                log({
                    message: `Successfully deleted collection ${collectionName} for dataroom ${dataroomId}`,
                    type: "info",
                });
                return true;
            } else {
                log({
                    message: `Failed to delete collection ${collectionName} for dataroom ${dataroomId}`,
                    type: "error",
                });
                return false;
            }
        } catch (error) {
            log({
                message: `Error deleting vectors from Qdrant for dataroom ${dataroomId}. Error: ${error}`,
                type: "error",
            });
            return false;
        }
    }
    public async deleteMultipleDocumentVectors(
        dataroomId: string,
        documentIds: string[],
        retryCount: number = 2
    ): Promise<boolean> {
        if (!documentIds || documentIds.length === 0) {
            log({
                message: `No document IDs provided for deletion in dataroom ${dataroomId}`,
                type: "info",
            });
            return true;
        }

        const startTime = Date.now();

        try {
            const collectionName = this.generateCollectionName(dataroomId);

            // Check if collection exists
            const collectionExists = await this.qdrantClient.collectionExists(collectionName);
            if (!collectionExists) {
                log({
                    message: `Collection ${collectionName} does not exist for dataroom ${dataroomId}`,
                    type: "info",
                });
                return true;
            }

            const collectionInfo = await this.qdrantClient.getCollectionInfo(collectionName);
            if (!collectionInfo || collectionInfo.pointsCount === 0) {
                log({
                    message: `No vectors found for documents in dataroom ${dataroomId}`,
                    type: "info",
                });
                return true;
            }

            const deleteResult = await this.qdrantClient.bulkDeleteDocumentVectors(
                collectionName,
                documentIds
            );

            if (deleteResult.success) {
                const duration = Date.now() - startTime;
                log({
                    message: `Successfully bulk deleted vectors for ${documentIds.length} documents in dataroom ${dataroomId} (${duration}ms)`,
                    type: "info",
                });
                return true;
            } else {
                throw new Error('Bulk deletion failed');
            }
        } catch (error) {
            const duration = Date.now() - startTime;

            if (retryCount > 0) {
                log({
                    message: `Retrying bulk vector deletion for ${documentIds.length} documents in dataroom ${dataroomId}. Attempts remaining: ${retryCount}`,
                    type: "error",
                });
                await new Promise(resolve => setTimeout(resolve, (3 - retryCount) * 1000));
                return this.deleteMultipleDocumentVectors(dataroomId, documentIds, retryCount - 1);
            }

            log({
                message: `Error bulk deleting vectors for ${documentIds.length} documents in dataroom ${dataroomId} after all retries (${duration}ms). Error: ${error}`,
                type: "error",
            });
            return false;
        }
    }

    /**
     * Check if a collection exists
     */
    public async collectionExists(dataroomId: string): Promise<boolean> {
        const collectionName = this.generateCollectionName(dataroomId);
        return await this.qdrantClient.collectionExists(collectionName);
    }

    /**
     * Get collection information
     */
    public async getCollectionInfo(dataroomId: string) {
        const collectionName = this.generateCollectionName(dataroomId);
        return await this.qdrantClient.getCollectionInfo(collectionName);
    }

    /**
     * Create a collection for a dataroom
     */
    public async createCollection(dataroomId: string, vectorSize: number = 1536): Promise<boolean> {
        const collectionName = this.generateCollectionName(dataroomId);
        return await this.qdrantClient.createCollection(collectionName, vectorSize);
    }

    /**
     * Upsert points to a collection
     */
    public async upsertPoints(dataroomId: string, points: QdrantPoint[], concurrency?: number): Promise<boolean> {
        const collectionName = this.generateCollectionName(dataroomId);
        return await this.qdrantClient.upsertPoints(collectionName, points, concurrency);
    }

    /**
     * Search for similar vectors
     */
    public async searchSimilar(
        dataroomId: string,
        vector: number[],
        limit: number = 10,
        scoreThreshold: number = 0.35,
        metadataFilter?: {
            documentIds?: string[];
            pageRanges?: string[];
            dataroomId?: string;
        }
    ) {
        const collectionName = this.generateCollectionName(dataroomId);
        return await this.qdrantClient.searchSimilar(collectionName, vector, limit, scoreThreshold, metadataFilter);
    }

    /**
     * Health check for Qdrant
     */
    public async healthCheck(): Promise<boolean> {
        return await this.qdrantClient.healthCheck();
    }
}

// Export singleton instance
export const vectorManager = VectorManager.getInstance();
