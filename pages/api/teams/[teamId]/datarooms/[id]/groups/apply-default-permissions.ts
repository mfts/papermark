import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { DefaultGroupPermissionStrategy, ItemType } from "@prisma/client";
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

    // POST /api/teams/:teamId/datarooms/:id/groups/apply-default-permissions
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
        res.status(401).end("Unauthorized");
        return;
    }

    const userId = (session.user as CustomUser).id;
    const { teamId, id: dataroomId } = req.query as { teamId: string; id: string };

    try {
        const { documentIds } = req.body as {
            documentIds: string[];
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

        // Check if dataroom is set to use default permissions
        if (dataroom.defaultGroupPermission !== DefaultGroupPermissionStrategy.use_default_permissions) {
            return res.status(400).json({
                message: "Dataroom is not configured to use default permissions"
            });
        }

        // Get all viewer groups with their default permissions
        const viewerGroups = await prisma.viewerGroup.findMany({
            where: {
                dataroomId,
            },
            select: {
                id: true,
                defaultCanView: true,
                defaultCanDownload: true,
            },
        });

        if (viewerGroups.length === 0) {
            return res.status(200).json({
                message: "No viewer groups found, no permissions applied"
            });
        }

        // Get dataroom document IDs for the provided document IDs
        const dataroomDocuments = await prisma.dataroomDocument.findMany({
            where: {
                documentId: {
                    in: documentIds,
                },
                dataroomId,
            },
            select: {
                id: true,
                documentId: true,
            },
        });

        if (dataroomDocuments.length === 0) {
            return res.status(404).json({
                message: "No documents found in this dataroom"
            });
        }

        // Build permissions to create
        const permissionsToCreate: {
            groupId: string;
            itemId: string;
            itemType: ItemType;
            canView: boolean;
            canDownload: boolean;
        }[] = [];

        viewerGroups.forEach((group) => {
            // Only create permissions if the group has view or download enabled
            if (group.defaultCanView || group.defaultCanDownload) {
                dataroomDocuments.forEach((doc) => {
                    permissionsToCreate.push({
                        groupId: group.id,
                        itemId: doc.id,
                        itemType: ItemType.DATAROOM_DOCUMENT,
                        canView: group.defaultCanView ?? false,
                        canDownload: group.defaultCanDownload ?? false,
                    });
                });
            }
        });

        if (permissionsToCreate.length === 0) {
            return res.status(200).json({
                message: "No default permissions configured, no permissions applied"
            });
        }

        // Apply permissions in a transaction
        await prisma.$transaction(async (tx) => {
            // First, remove any existing permissions for these documents and groups
            await tx.viewerGroupAccessControls.deleteMany({
                where: {
                    itemId: {
                        in: dataroomDocuments.map(doc => doc.id),
                    },
                    itemType: ItemType.DATAROOM_DOCUMENT,
                    groupId: {
                        in: viewerGroups.map(group => group.id),
                    },
                },
            });

            // Then create the new default permissions
            await tx.viewerGroupAccessControls.createMany({
                data: permissionsToCreate,
                skipDuplicates: true,
            });
        });

        res.status(200).json({
            message: "Default permissions applied successfully",
            appliedPermissions: permissionsToCreate.length,
            documentsProcessed: dataroomDocuments.length,
            groupsProcessed: viewerGroups.length,
        });

    } catch (error) {
        console.error("Error applying default permissions:", error);
        res.status(500).json({ message: "Internal server error" });
    }
} 