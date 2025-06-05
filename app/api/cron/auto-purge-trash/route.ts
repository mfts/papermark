import { NextResponse } from "next/server";

import { receiver } from "@/lib/cron";
import { getTrashItemsInFolderHierarchy } from "@/lib/api/dataroom/trash-utils";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";
import { ItemType } from "@prisma/client";

/**
 * Cron job to automatically purge trash items that have passed their purgeAt date.
 * This permanently deletes both DataroomDocuments and DataroomFolders along with their TrashItem records.
 * 
 */

export const maxDuration = 300; // 5 minutes

export async function POST(req: Request) {
    const body = await req.json();
    if (process.env.VERCEL === "1") {
        const isValid = await receiver.verify({
            signature: req.headers.get("Upstash-Signature") || "",
            body: JSON.stringify(body),
        });
        if (!isValid) {
            return new Response("Unauthorized", { status: 401 });
        }
    }

    try {
        const now = new Date();

        // Find all trash items that need to be purged
        const expiredTrashItems = await prisma.trashItem.findMany({
            where: {
                purgeAt: {
                    lte: now, // purgeAt is less than or equal to current time
                },
            },
            orderBy: [
                { itemType: 'desc' }, // Process folders first (to handle hierarchy)
                { deletedAt: 'asc' }   // Process older items first
            ],
            select: {
                id: true,
                itemId: true,
                itemType: true,
                dataroomId: true,
                dataroomDocumentId: true,
                dataroomFolderId: true,
                name: true,
                purgeAt: true,
            },
        });

        if (expiredTrashItems.length === 0) {
            await log({
                message: "Auto-purge completed: No expired trash items found",
                type: "cron",
            });
            return NextResponse.json({
                message: "No expired items to purge",
                purgedCount: 0
            });
        }

        let totalPurged = 0;
        const errors: string[] = [];

        // Process each expired item
        for (const trashItem of expiredTrashItems) {
            try {
                await prisma.$transaction(async (tx) => {
                    if (trashItem.itemType === ItemType.DATAROOM_FOLDER && trashItem.dataroomFolderId) {
                        // For folders, we need to get all child items and delete them recursively
                        const trashItemsToDelete = await getTrashItemsInFolderHierarchy(
                            trashItem.dataroomFolderId,
                            trashItem.dataroomId,
                            tx,
                            trashItem,
                        );

                        // Delete all child items first
                        const documentIds: string[] = [];
                        const folderIds: string[] = [];
                        const trashItemIds: string[] = [];

                        // Collect IDs for bulk deletion
                        for (const item of trashItemsToDelete) {
                            if (item.itemType === ItemType.DATAROOM_DOCUMENT && item.dataroomDocumentId) {
                                documentIds.push(item.dataroomDocumentId);
                            } else if (item.itemType === ItemType.DATAROOM_FOLDER && item.dataroomFolderId) {
                                folderIds.push(item.dataroomFolderId);
                            }
                            trashItemIds.push(item.id);
                        }

                        // Perform bulk deletions concurrently
                        await Promise.all([
                            // Delete documents in bulk
                            documentIds.length > 0 ? tx.dataroomDocument.deleteMany({
                                where: {
                                    id: { in: documentIds },
                                },
                            }) : Promise.resolve(),

                            // Delete folders in bulk
                            folderIds.length > 0 ? tx.dataroomFolder.deleteMany({
                                where: {
                                    id: { in: folderIds },
                                },
                            }) : Promise.resolve(),

                            // Delete trash items in bulk
                            trashItemIds.length > 0 ? tx.trashItem.deleteMany({
                                where: {
                                    id: { in: trashItemIds },
                                },
                            }) : Promise.resolve(),
                        ]);
                    } else if (trashItem.itemType === ItemType.DATAROOM_DOCUMENT && trashItem.dataroomDocumentId) {
                        // For documents, delete the document and trash item concurrently
                        await Promise.all([
                            tx.dataroomDocument.deleteMany({
                                where: {
                                    id: trashItem.dataroomDocumentId,
                                },
                            }),
                            tx.trashItem.delete({
                                where: {
                                    id: trashItem.id,
                                },
                            }),
                        ]);
                    }
                });

                totalPurged++;

                await log({
                    message: `Auto-purged ${trashItem.itemType}: "${trashItem.name}" (ID: ${trashItem.itemId})`,
                    type: "cron",
                });

            } catch (error) {
                const errorMessage = `Failed to purge ${trashItem.itemType} "${trashItem.name}" (ID: ${trashItem.itemId}): ${(error as Error).message}`;
                errors.push(errorMessage);

                await log({
                    message: errorMessage,
                    type: "cron",
                    mention: true,
                });
            }
        }

        // Summary log
        const summaryMessage = `Auto-purge completed: ${totalPurged}/${expiredTrashItems.length} items purged successfully`;
        if (errors.length > 0) {
            await log({
                message: `${summaryMessage}. ${errors.length} errors encountered.`,
                type: "cron",
                mention: true,
            });
        } else {
            await log({
                message: summaryMessage,
                type: "cron",
            });
        }

        return NextResponse.json({
            message: summaryMessage,
            purgedCount: totalPurged,
            totalExpired: expiredTrashItems.length,
            errors: errors.length > 0 ? errors : undefined,
        });

    } catch (error) {
        await log({
            message: `Auto-purge cron failed. \n\nError: ${(error as Error).message}`,
            type: "cron",
            mention: true,
        });
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
} 