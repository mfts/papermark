import { redis } from "@/lib/redis";
import { logger } from "@trigger.dev/sdk/v3";
import { getErrorMessage } from "./errors";
import { RAGError } from './errors';

interface RAGIndexingRequest {
    dataroomId: string;
    teamId: string;
    userId: string;
    timestamp: number;
    requestId?: string; // For deduplication
}

export class RAGQueueManager {
    private static readonly LOCK_KEY_PREFIX = "rag_indexing_lock:";
    private static readonly QUEUE_KEY_PREFIX = "rag_indexing_queue:";
    private static readonly LOCK_TTL = 60 * 60;
    private static readonly QUEUE_TTL = 60 * 60;

    private static validateInput(dataroomId: string, request?: any): void {
        if (!dataroomId || typeof dataroomId !== 'string' || dataroomId.length === 0) {
            throw RAGError.create('validation', 'Invalid dataroomId: must be a non-empty string', { field: 'dataroomId' });
        }

        if (request) {
            if (!request.teamId || !request.userId) {
                throw RAGError.create('validation', 'Invalid request: teamId and userId are required', { field: 'request' });
            }
        }
    }

    private static generateRequestId(request: Omit<RAGIndexingRequest, 'timestamp' | 'requestId'>): string {
        const { dataroomId, teamId } = request;
        return `${dataroomId}_${teamId}_${crypto.randomUUID()}`;
    }

    /**
     * Release the lock for a dataroom
     */
    static async releaseLock(dataroomId: string): Promise<void> {
        this.validateInput(dataroomId);

        const lockKey = `${this.LOCK_KEY_PREFIX}${dataroomId}`;

        try {
            await redis.del(lockKey);
            logger.info("Lock released", { dataroomId });
        } catch (error) {
            logger.error("Failed to release lock", {
                dataroomId,
                error: getErrorMessage(error)
            });
        }
    }

    static async addToQueue(
        dataroomId: string,
        request: Omit<RAGIndexingRequest, "timestamp" | "requestId">
    ): Promise<void> {
        this.validateInput(dataroomId, request);

        const queueKey = `${this.QUEUE_KEY_PREFIX}${dataroomId}`;
        const requestId = this.generateRequestId(request);
        const requestWithTimestamp: RAGIndexingRequest = {
            ...request,
            timestamp: Date.now(),
            requestId,
        };

        try {
            // Fetch all existing requests
            const existingRequests = await redis.zrange<string[]>(queueKey, 0, -1);

            const hasDuplicate = existingRequests.some((req) => {
                try {
                    let parsed: RAGIndexingRequest;
                    // Handle both string and object responses from Redis
                    if (typeof req === "object" && req !== null) {
                        // Redis client auto-parsed the JSON
                        parsed = req as RAGIndexingRequest;
                    } else {
                        parsed = JSON.parse(req) as RAGIndexingRequest;
                    }
                    return parsed.requestId === requestId;
                } catch {
                    return false;
                }
            });

            if (hasDuplicate) {
                logger.info("Duplicate request detected, skipping", {
                    dataroomId,
                    requestId,
                    existingQueueLength: existingRequests.length,
                });
                return;
            }

            // Add to queue with timestamp as score for ordering
            await redis.zadd(queueKey, {
                score: requestWithTimestamp.timestamp,
                member: JSON.stringify(requestWithTimestamp),
            });

            // Set TTL on the queue
            await redis.expire(queueKey, this.QUEUE_TTL);

            logger.info("Request added to queue", {
                dataroomId,
                requestId,
                queueLength: await this.getQueueLength(dataroomId),
            });
        } catch (error) {
            logger.error("Failed to add request to queue", {
                dataroomId,
                requestId,
                error: getErrorMessage(error),
            });
            throw error;
        }
    }

    static async getNextFromQueue(
        dataroomId: string
    ): Promise<RAGIndexingRequest | null> {
        this.validateInput(dataroomId);

        const queueKey = `${this.QUEUE_KEY_PREFIX}${dataroomId}`;

        try {
            // Get the oldest request (lowest score)
            const result = await redis.zrange<string[]>(queueKey, 0, 0);

            if (result.length === 0) {
                return null;
            }

            const requestStr = result[0];
            let request: RAGIndexingRequest;

            try {
                if (typeof requestStr === "object" && requestStr !== null) {
                    request = requestStr as RAGIndexingRequest;
                } else {
                    request = JSON.parse(requestStr as string) as RAGIndexingRequest;
                }
            } catch (err) {
                throw new Error(`Invalid JSON in queue: ${requestStr}`);
            }

            // Remove this request from the queue
            await redis.zrem(queueKey, requestStr);

            logger.info("Request retrieved from queue", {
                dataroomId,
                requestId: request.requestId,
                remainingQueueLength: await this.getQueueLength(dataroomId),
                requestData: {
                    teamId: request.teamId,
                    userId: request.userId,
                },
            });

            return request;
        } catch (error) {
            logger.error("Failed to get next request from queue", {
                dataroomId,
                error: getErrorMessage(error),
            });
            return null;
        }
    }


    static async hasPendingRequests(dataroomId: string): Promise<boolean> {
        this.validateInput(dataroomId);

        try {
            const count = await this.getQueueLength(dataroomId);
            return count > 0;
        } catch (error) {
            logger.error("Failed to check pending requests", {
                dataroomId,
                error: getErrorMessage(error)
            });
            return false;
        }
    }

    static async getQueueLength(dataroomId: string): Promise<number> {
        this.validateInput(dataroomId);

        const queueKey = `${this.QUEUE_KEY_PREFIX}${dataroomId}`;

        try {
            return await redis.zcard(queueKey);
        } catch (error) {
            logger.error("Failed to get queue length", {
                dataroomId,
                error: getErrorMessage(error)
            });
            return 0;
        }
    }

    static async getPendingRequests(
        dataroomId: string
    ): Promise<RAGIndexingRequest[]> {
        this.validateInput(dataroomId);

        const queueKey = `${this.QUEUE_KEY_PREFIX}${dataroomId}`;

        try {
            const requests = await redis.zrange<string[]>(queueKey, 0, -1);

            return requests
                .map((req) => {
                    try {
                        if (typeof req === "object" && req !== null) {
                            return req as RAGIndexingRequest;
                        } else {
                            return JSON.parse(req) as RAGIndexingRequest;
                        }
                    } catch {
                        logger.warn("Failed to parse request from queue", {
                            dataroomId,
                            request: req,
                        });
                        return null;
                    }
                })
                .filter((r): r is RAGIndexingRequest => r !== null);
        } catch (error) {
            logger.error("Failed to get pending requests", {
                dataroomId,
                error: getErrorMessage(error),
            });
            return [];
        }
    }


    /**
     * Try to atomically start a worker by acquiring the lock
     * Returns true if lock acquired (worker should start), false if already locked
     */
    static async tryStartWorker(dataroomId: string): Promise<boolean> {
        this.validateInput(dataroomId);

        const lockKey = `${this.LOCK_KEY_PREFIX}${dataroomId}`;
        const timestamp = Date.now();

        try {
            // Try to set the lock with NX (only if not exists) and expiration
            const result = await redis.set(lockKey, timestamp.toString(), {
                nx: true,
                ex: this.LOCK_TTL
            });

            const acquired = result === "OK";

            console.log("Worker start attempt", {
                dataroomId,
                acquired,
                timestamp,
                lockTTL: this.LOCK_TTL
            });

            return acquired;
        } catch (error) {
            console.log("Failed to try start worker", {
                dataroomId,
                error: getErrorMessage(error)
            });
            return false;
        }
    }

    /**
     * Check if indexing is currently running for a dataroom
     */
    static async isIndexingRunning(dataroomId: string): Promise<boolean> {
        this.validateInput(dataroomId);

        const lockKey = `${this.LOCK_KEY_PREFIX}${dataroomId}`;

        try {
            const lockExists = await redis.exists(lockKey);
            return lockExists === 1;
        } catch (error) {
            logger.error("Failed to check indexing status", {
                dataroomId,
                error: getErrorMessage(error)
            });
            return false;
        }
    }
}
