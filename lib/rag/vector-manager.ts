import { QdrantVectorStore, QdrantPoint } from './qdrant-client';
import { log } from '@/lib/utils';

// Constants
const DEFAULT_VECTOR_SIZE = 1536;

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
        retryCount: number = 2
    ): Promise<boolean> {
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
                    message: `No vectors found for document ${documentName || documentId} in dataroom ${dataroomId}`,
                    type: "info",
                });
                return true;
            }

            const deleteResult = await this.qdrantClient.deletePointsByFilter(collectionName, {
                documentId: documentId
            });

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
        } catch (error) {
            const duration = Date.now() - startTime;

            if (retryCount > 0) {
                log({
                    message: `Retrying vector deletion for document ${documentName || documentId} in dataroom ${dataroomId}. Attempts remaining: ${retryCount}`,
                    type: "error",
                });
                await new Promise(resolve => setTimeout(resolve, (3 - retryCount) * 1000));
                return this.deleteDocumentVectors(dataroomId, documentId, documentName, retryCount - 1);
            }

            log({
                message: `Error deleting vectors for document ${documentName || documentId} in dataroom ${dataroomId} after all retries (${duration}ms). Error: ${error}`,
                type: "error",
            });
            return false;
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
    public async createCollection(dataroomId: string, vectorSize: number = DEFAULT_VECTOR_SIZE): Promise<boolean> {
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
        scoreThreshold: number = 0.7
    ) {
        const collectionName = this.generateCollectionName(dataroomId);
        return await this.qdrantClient.searchSimilar(collectionName, vector, limit, scoreThreshold);
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

// Export convenience functions for backward compatibility
export const deleteDocumentVectors = (dataroomId: string, documentId: string, documentName?: string) =>
    vectorManager.deleteDocumentVectors(dataroomId, documentId, documentName);

export const deleteDataroomVectors = (dataroomId: string) =>
    vectorManager.deleteDataroomVectors(dataroomId);

export const deleteMultipleDocumentVectors = (dataroomId: string, documentIds: string[]) =>
    vectorManager.deleteMultipleDocumentVectors(dataroomId, documentIds);
