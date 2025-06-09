import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { ItemType } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import slugify from "@sindresorhus/slugify";

async function moveNestedTrashItems(tx: any, parentFolderId: string, parentPath: string, dataroomId: string) {
    const nestedTrashItems = await tx.trashItem.findMany({
        where: {
            parentId: parentFolderId,
            dataroomId,
        },
        select: {
            id: true,
            itemId: true,
            itemType: true,
            trashPath: true,
            name: true,
            parentId: true,
            dataroomFolderId: true,
            dataroomDocumentId: true,
        },
    });

    for (const nestedItem of nestedTrashItems) {
        if (nestedItem.itemType === ItemType.DATAROOM_FOLDER && nestedItem.dataroomFolderId) {
            const newPath = parentPath ? `${parentPath}/${slugify(nestedItem.name)}` : `/${slugify(nestedItem.name)}`;

            await tx.dataroomFolder.update({
                where: {
                    id: nestedItem.dataroomFolderId,
                },
                data: {
                    parentId: parentFolderId,
                    path: newPath,
                    removedAt: null,
                },
            });

            await moveNestedTrashItems(tx, nestedItem.dataroomFolderId, newPath, dataroomId);

            await tx.trashItem.delete({
                where: {
                    id: nestedItem.id,
                },
            });
        } else if (nestedItem.itemType === ItemType.DATAROOM_DOCUMENT && nestedItem.dataroomDocumentId) {
            await tx.dataroomDocument.update({
                where: {
                    id: nestedItem.dataroomDocumentId,
                    dataroomId,
                },
                data: {
                    folderId: parentFolderId,
                    removedAt: null,
                },
            });

            await tx.trashItem.delete({
                where: {
                    id: nestedItem.id,
                },
            });
        }
    }
}

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method === "POST") {
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            res.status(401).end("Unauthorized");
            return;
        }

        const {
            teamId,
            id: dataroomId,
        } = req.query as {
            teamId: string;
            id: string;
        };

        const {
            trashItemIds,
            selectedFolderId,
            selectedFolderPath,
        } = req.body as {
            trashItemIds: string[];
            selectedFolderId: string | null;
            selectedFolderPath: string | null;
        };

        if (!trashItemIds || trashItemIds.length === 0) {
            return res.status(400).json({ message: "No items selected" });
        }

        const userId = (session.user as CustomUser).id;

        try {
            const team = await prisma.team.findUnique({
                where: {
                    id: teamId,
                    users: {
                        some: {
                            userId: userId,
                        },
                    },
                },
            });

            if (!team) {
                return res.status(401).end("Unauthorized");
            }

            const dataroom = await prisma.dataroom.findUnique({
                where: {
                    id: dataroomId,
                    teamId: team.id,
                },
            });

            if (!dataroom) {
                return res.status(404).end("Dataroom not found");
            }

            let targetFolder = null;
            if (selectedFolderId) {
                targetFolder = await prisma.dataroomFolder.findUnique({
                    where: {
                        id: selectedFolderId,
                        dataroomId,
                        removedAt: null,
                    },
                });

                if (!targetFolder) {
                    return res.status(400).json({
                        message: "Target folder not found or is in trash",
                    });
                }
            }

            // Get all trash items with their trash paths
            const trashItems = await prisma.trashItem.findMany({
                where: {
                    id: {
                        in: trashItemIds,
                    },
                    dataroomId,
                },
                select: {
                    id: true,
                    itemId: true,
                    itemType: true,
                    trashPath: true,
                    name: true,
                    parentId: true,
                    dataroomFolderId: true,
                    dataroomDocumentId: true,
                },
            });

            await prisma.$transaction(async (tx) => {
                // First, check for collisions before making any changes
                const foldersToRestore = trashItems.filter(
                    item => item.itemType === ItemType.DATAROOM_FOLDER && item.dataroomFolderId
                );
                const documentsToRestore = trashItems.filter(
                    item => item.itemType === ItemType.DATAROOM_DOCUMENT && item.dataroomDocumentId
                );

                // Check for folder name collisions in the target folder
                if (foldersToRestore.length > 0) {
                    const existingFolders = await tx.dataroomFolder.findMany({
                        where: {
                            dataroomId,
                            parentId: selectedFolderId, // Check only inside the target folder
                            removedAt: null,
                        },
                        select: { name: true },
                    });

                    if (existingFolders.length > 0) {
                        const existingFolderNames = new Set(
                            existingFolders.map((f) => f.name)
                        );
                        const duplicateFolderNames = foldersToRestore
                            .map((item) => item.name)
                            .filter((name) => existingFolderNames.has(name));

                        if (duplicateFolderNames.length > 0) {
                            throw new Error(
                                `Cannot restore folders: Duplicate names found in target folder - ${duplicateFolderNames.join(", ")}`
                            );
                        }
                    }
                }

                // Check for document name collisions in the target folder
                if (documentsToRestore.length > 0) {
                    const existingDocuments = await tx.dataroomDocument.findMany({
                        where: {
                            dataroomId,
                            folderId: selectedFolderId, // Check only inside the target folder
                            removedAt: null,
                        },
                        include: {
                            document: {
                                select: { name: true },
                            },
                        },
                    });

                    if (existingDocuments.length > 0) {
                        const existingDocumentNames = new Set(
                            existingDocuments.map((d) => d.document.name)
                        );
                        const duplicateDocumentNames = documentsToRestore
                            .map((item) => item.name)
                            .filter((name) => existingDocumentNames.has(name));

                        if (duplicateDocumentNames.length > 0) {
                            throw new Error(
                                `Cannot restore documents: Duplicate names found in target folder - ${duplicateDocumentNames.join(", ")}`
                            );
                        }
                    }
                }

                // If no collisions, proceed with restoration
                for (const item of trashItems) {
                    if (
                        item.itemType === ItemType.DATAROOM_FOLDER &&
                        item.dataroomFolderId
                    ) {
                        const newPath = selectedFolderId
                            ? `${selectedFolderPath}/${slugify(item.name)}`
                            : `/${slugify(item.name)}`;

                        // Move folder
                        await tx.dataroomFolder.update({
                            where: {
                                id: item.dataroomFolderId,
                            },
                            data: {
                                parentId: selectedFolderId || null,
                                path: newPath,
                                removedAt: null,
                            },
                        });

                        // Move all nested items recursively
                        await moveNestedTrashItems(tx, item.dataroomFolderId, newPath, dataroomId);

                        await tx.trashItem.delete({
                            where: {
                                id: item.id,
                            },
                        });
                    } else if (
                        item.itemType === ItemType.DATAROOM_DOCUMENT &&
                        item.dataroomDocumentId
                    ) {
                        await tx.dataroomDocument.update({
                            where: {
                                id: item.dataroomDocumentId,
                                dataroomId,
                            },
                            data: {
                                folderId: selectedFolderId || null,
                                removedAt: null,
                            },
                        });
                        await tx.trashItem.delete({
                            where: {
                                id: item.id,
                            },
                        });
                    }
                }
            });

            return res.status(200).json({ message: "Items moved successfully" });
        } catch (error) {
            errorhandler(error, res);
        }
    } else {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 