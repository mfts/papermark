import { tasks } from "@trigger.dev/sdk/v3";
import type { ragIndexingTask, RAGIndexingPayload } from "../trigger/rag-indexing";
import prisma from "@/lib/prisma";
import { RAGQueueManager } from "./queue-manager";
import { RAGError } from './errors';
import { ParsingStatus } from "@prisma/client";
import { getFeatureFlags } from "@/lib/featureFlags";

export type IndexingTriggerResult =
    | { status: 'started'; taskId: string }
    | { status: 'queued' }
    | { status: 'no_documents_to_index' }
    | { status: 'feature_disabled' };

export async function triggerDataroomIndexing(
    dataroomId: string,
    teamId: string,
    userId: string,
): Promise<string> {
    return RAGError.withErrorHandling(
        async () => {
            const requiredFields = { dataroomId, teamId, userId };

            for (const [field, value] of Object.entries(requiredFields)) {
                if (!value?.trim()) {
                    throw RAGError.create(
                        'validation',
                        `${field} is required and must be a non-empty string`,
                        { field, operation: 'triggerDataroomIndexing' }
                    );
                }
            }
            const featureFlags = await getFeatureFlags({ teamId });
            if (!featureFlags?.ragIndexing) {
                console.log("RAG indexing feature is disabled", { dataroomId, teamId, userId });
                return "feature_disabled";
            }

            const unindexedCount = await prisma.dataroomDocument.count({
                where: {
                    dataroomId,
                    document: {
                        ragIndexingStatus: {
                            notIn: [ParsingStatus.COMPLETED, ParsingStatus.IN_PROGRESS],
                        },
                    },
                },
            });

            console.log("Unindexed documents count", {
                dataroomId,
                unindexedCount,
                operation: 'triggerDataroomIndexing'
            });

            if (unindexedCount <= 0) {
                console.log("No documents to index", { dataroomId });
                return "no_documents_to_index";
            }

            // Add request to queue
            await RAGQueueManager.addToQueue(dataroomId, {
                dataroomId,
                teamId,
                userId,
            });

            // Try to start worker
            const workerStarted = await RAGQueueManager.tryStartWorker(dataroomId);
            console.log("Worker start attempt", {
                dataroomId,
                workerStarted,
                operation: 'triggerDataroomIndexing'
            });

            if (workerStarted) {
                const queueLength = await RAGQueueManager.getQueueLength(dataroomId);
                console.log("Starting RAG indexing worker", {
                    dataroomId,
                    queueLength,
                    operation: 'triggerDataroomIndexing'
                });

                const payload: RAGIndexingPayload = {
                    dataroomId,
                    teamId,
                    userId,
                };

                const handle = await tasks.trigger<typeof ragIndexingTask>("rag-indexing", payload, {
                    idempotencyKey: `rag_worker_${dataroomId}_${Date.now()}`,
                    tags: [
                        `dataroom_${dataroomId}`,
                        `team_${teamId}`,
                        `user_${userId}`,
                        "rag_worker",
                    ],
                });

                console.log("RAG indexing worker started successfully", {
                    dataroomId,
                    taskId: handle.id,
                    operation: 'triggerDataroomIndexing'
                });

                return handle.id;
            } else {
                console.log("RAG indexing worker already running, request queued", {
                    dataroomId,
                    operation: 'triggerDataroomIndexing'
                });
                return "queued";
            }
        },
        'indexingTrigger',
        { dataroomId, teamId, userId }
    );
}

export async function getRAGIndexingStatus(dataroomId: string) {
    return RAGError.withErrorHandling(
        async () => {
            if (!dataroomId?.trim()) {
                throw RAGError.create('validation', 'dataroomId is required and must be a non-empty string', {
                    field: 'dataroomId',
                    operation: 'getRAGIndexingStatus'
                });
            }

            const [settings, isRunning, queueLength, pendingRequests] = await Promise.all([
                prisma.dataroomRAGSettings.findUnique({
                    where: { dataroomId },
                }),
                RAGQueueManager.isIndexingRunning(dataroomId),
                RAGQueueManager.getQueueLength(dataroomId),
                RAGQueueManager.getPendingRequests(dataroomId)
            ]);

            console.log("RAG indexing status retrieved", {
                dataroomId,
                isRunning,
                queueLength,
                pendingRequestsCount: pendingRequests.length,
                operation: 'getRAGIndexingStatus'
            });

            return {
                settings,
                isRunning,
                queueLength,
                pendingRequests
            };
        },
        'getRAGIndexingStatus',
        { dataroomId }
    );
} 