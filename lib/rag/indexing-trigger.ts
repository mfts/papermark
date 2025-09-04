import { tasks } from "@trigger.dev/sdk/v3";
import type { ragIndexingTask, RAGIndexingPayload } from "../trigger/rag-indexing";
import prisma from "@/lib/prisma";
import { RAGQueueManager } from "./queue-manager";
import { RAGError } from './errors';
import { ParsingStatus } from "@prisma/client";
import { getFeatureFlags } from "@/lib/featureFlags";


export async function triggerDataroomIndexing(
    dataroomId: string,
    teamId: string,
    userId: string,
): Promise<string> {
    if (!dataroomId || !teamId || !userId) {
        throw RAGError.create('validation', 'Missing required parameters: dataroomId, teamId, and userId are required', { field: 'parameters' });
    }
    try {
        const features = await getFeatureFlags({ teamId });
        if (!features.ragIndexing) {
            throw RAGError.create('feature_disabled', 'RAG indexing is not available for this team', { field: 'feature_access' });
        }
    } catch (error) {
        throw RAGError.create('feature_check_failed', 'Failed to verify feature access', { field: 'feature_verification' });
    }

    const [unindexedCount] = await Promise.all([
        prisma.dataroomDocument.count({
            where: {
                dataroomId,
                document: {
                    ragIndexingStatus: {
                        notIn: [ParsingStatus.COMPLETED, ParsingStatus.IN_PROGRESS],
                    },
                },
            },
        }),
    ]);

    console.log("unindexedCount", unindexedCount);
    if (unindexedCount <= 0) {
        console.log('go back')
        return "no_documents_to_index";
    }

    await RAGQueueManager.addToQueue(dataroomId, {
        dataroomId,
        teamId,
        userId,
    });

    const workerStarted = await RAGQueueManager.tryStartWorker(dataroomId);
    console.log('workerStarted', workerStarted)

    if (workerStarted) {
        console.log("Starting RAG indexing worker", {
            dataroomId,
            queueLength: await RAGQueueManager.getQueueLength(dataroomId)
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

        console.log("RAG indexing worker started", {
            dataroomId,
            taskId: handle.id
        });

        return handle.id;
    } else {
        console.log("RAG indexing worker already running, request queued", { dataroomId });
        return "queued";
    }
}

export async function getRAGIndexingStatus(dataroomId: string) {
    const settings = await prisma.dataroomRAGSettings.findUnique({
        where: { dataroomId },
    });

    const isRunning = await RAGQueueManager.isIndexingRunning(dataroomId);
    const queueLength = await RAGQueueManager.getQueueLength(dataroomId);
    const pendingRequests = await RAGQueueManager.getPendingRequests(dataroomId);

    return {
        settings,
        isRunning,
        queueLength,
        pendingRequests
    };
} 