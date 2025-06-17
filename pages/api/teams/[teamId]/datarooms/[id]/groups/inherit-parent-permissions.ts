import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { ItemType } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    // POST /api/teams/:teamId/datarooms/:id/groups/inherit-parent-permissions
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
        res.status(401).end("Unauthorized");
        return;
    }

    const userId = (session.user as CustomUser).id;
    const { teamId, id: dataroomId } = req.query as { teamId: string; id: string };

    try {
        const { documentIds, folderPath } = req.body as {
            documentIds: string[];
            folderPath?: string;
        };

        // Validate input
        if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
            return res.status(400).json({ message: "Document IDs are required" });
        }

        // Check if the user is part of the team
        const team = await prisma.team.findUnique({
            where: {
                id: teamId,
                users: {
                    some: {
                        userId,
                    },
                },
            },
        });

        if (!team) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Get dataroom and verify it exists and belongs to the team
        const dataroom = await prisma.dataroom.findUnique({
            where: {
                id: dataroomId,
                teamId,
            },
            select: {
                id: true,
                defaultGroupPermission: true,
            },
        });

        if (!dataroom) {
            return res.status(404).json({ message: "Dataroom not found" });
        }

        // Get all viewer groups
        const viewerGroups = await prisma.viewerGroup.findMany({
            where: {
                dataroomId,
            },
            select: {
                id: true,
                name: true,
            },
        });

        if (viewerGroups.length === 0) {
            return res.status(200).json({
                message: "No viewer groups found, no permissions applied"
            });
        }

        // Get dataroom document IDs for the new documents
        const newDataroomDocuments = await prisma.dataroomDocument.findMany({
            where: {
                documentId: {
                    in: documentIds,
                },
                dataroomId,
            },
            select: {
                id: true,
                documentId: true,
                folderId: true,
            },
        });

        if (newDataroomDocuments.length === 0) {
            return res.status(404).json({
                message: "No documents found in this dataroom"
            });
        }

        // Determine the parent folder ID based on the folderPath or new documents' folderId
        let parentFolderId: string | null = null;

        if (folderPath) {
            // Find the folder by path
            const folder = await prisma.dataroomFolder.findUnique({
                where: {
                    dataroomId_path: {
                        dataroomId,
                        path: `/${folderPath}`,
                    },
                },
                select: {
                    id: true,
                },
            });
            parentFolderId = folder?.id || null;
        } else {
            // Use the folderId from the first new document (they should all be in the same folder)
            parentFolderId = newDataroomDocuments[0]?.folderId || null;
        }

        if (!parentFolderId) {
            return res.status(200).json({
                message: "Root level upload: please set permissions manually."
            });
        }

        // Get all permissions for the parent folder
        const parentFolderPermissions = await prisma.viewerGroupAccessControls.findMany({
            where: {
                itemId: parentFolderId,
                itemType: ItemType.DATAROOM_FOLDER,
                groupId: {
                    in: viewerGroups.map(group => group.id),
                },
            },
            select: {
                groupId: true,
                canView: true,
                canDownload: true,
            },
        });

        if (parentFolderPermissions.length === 0) {
            return res.status(200).json({
                message: "Parent folder has no permissions to inherit."
            });
        }

        // Build permissions to create for new documents
        const permissionsToCreate: {
            groupId: string;
            itemId: string;
            itemType: ItemType;
            canView: boolean;
            canDownload: boolean;
        }[] = [];

        parentFolderPermissions.forEach((permission) => {
            newDataroomDocuments.forEach((doc) => {
                permissionsToCreate.push({
                    groupId: permission.groupId,
                    itemId: doc.id,
                    itemType: ItemType.DATAROOM_DOCUMENT,
                    canView: permission.canView,
                    canDownload: permission.canDownload,
                });
            });
        });

        if (permissionsToCreate.length === 0) {
            return res.status(200).json({
                message: "No consistent permissions found to inherit"
            });
        }

        // Apply inherited permissions in a transaction
        await prisma.$transaction(async (tx) => {
            // First, remove any existing permissions for these documents and groups
            await tx.viewerGroupAccessControls.deleteMany({
                where: {
                    itemId: {
                        in: newDataroomDocuments.map(doc => doc.id),
                    },
                    itemType: ItemType.DATAROOM_DOCUMENT,
                    groupId: {
                        in: viewerGroups.map(group => group.id),
                    },
                },
            });

            // Then create the inherited permissions
            await tx.viewerGroupAccessControls.createMany({
                data: permissionsToCreate,
                skipDuplicates: true,
            });
        });

        res.status(200).json({
            message: "Parent folder permissions inherited successfully",
            appliedPermissions: permissionsToCreate.length,
            documentsProcessed: newDataroomDocuments.length,
            groupsProcessed: viewerGroups.length,
        });

    } catch (error) {
        console.error("Error inheriting parent permissions:", error);
        res.status(500).json({ message: "Internal server error" });
    }
} 