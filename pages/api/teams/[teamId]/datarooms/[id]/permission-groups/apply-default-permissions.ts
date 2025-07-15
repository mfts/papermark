import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { DefaultGroupPermissionStrategy, ItemType } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const session = await getServerSession(req, res, authOptions);
    if (!session) {
        return res.status(401).end("Unauthorized");
    }

    const { teamId, id: dataroomId } = req.query as {
        teamId: string;
        id: string;
    };
    const userId = (session.user as CustomUser).id;

    try {
        const { documentIds } = req.body as {
            documentIds: string[];
        };

        if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
            return res.status(400).json({ message: "Document IDs are required" });
        }

        // Check if the user is part of the team
        const team = await prisma.team.findFirst({
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
            },
            select: {
                id: true,
                teamId: true,
                defaultGroupPermission: true,
                defaultLinkPermission: true,
                defaultLinkCanView: true,
                defaultLinkCanDownload: true,
            },
        });

        if (!dataroom || dataroom.teamId !== teamId) {
            return res.status(404).json({ message: "Dataroom not found" });
        }

        // Check if dataroom is set to use default permissions for PermissionGroups
        if (dataroom.defaultLinkPermission !== "use_default_permissions" && dataroom.defaultLinkPermission !== "use_simple_permissions") {
            return res.status(400).json({
                message: "Dataroom is not configured to use default permissions for PermissionGroups"
            });
        }

        // Get all permission groups with their default permissions
        const permissionGroups = await prisma.permissionGroup.findMany({
            where: {
                dataroomId,
            },
            select: {
                id: true,
                defaultCanView: true,
                defaultCanDownload: true,
            },
        });

        if (permissionGroups.length === 0) {
            return res.status(200).json({
                message: "No permission groups found, no permissions applied"
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
            canDownloadOriginal: boolean;
        }[] = [];

        if (dataroom.defaultLinkPermission === "use_simple_permissions") {
            // For simple permissions, use global dataroom settings for all groups
            const globalCanView = dataroom.defaultLinkCanView ?? false;
            const globalCanDownload = dataroom.defaultLinkCanDownload ?? false;

            if (globalCanView || globalCanDownload) {
                permissionGroups.forEach((group) => {
                    dataroomDocuments.forEach((doc) => {
                        permissionsToCreate.push({
                            groupId: group.id,
                            itemId: doc.id,
                            itemType: ItemType.DATAROOM_DOCUMENT,
                            // If download is enabled, automatically enable view
                            canView: globalCanView || globalCanDownload,
                            canDownload: globalCanDownload,
                            canDownloadOriginal: false,
                        });
                    });
                });
            }
        } else {
            // For other strategies, use individual group defaults
            permissionGroups.forEach((group) => {
                // Only create permissions if the group has view or download enabled
                if (group.defaultCanView || group.defaultCanDownload) {
                    dataroomDocuments.forEach((doc) => {
                        const canDownload = group.defaultCanDownload ?? false;
                        const canView = group.defaultCanView ?? false;

                        permissionsToCreate.push({
                            groupId: group.id,
                            itemId: doc.id,
                            itemType: ItemType.DATAROOM_DOCUMENT,
                            // If download is enabled, automatically enable view
                            canView: canView || canDownload,
                            canDownload: canDownload,
                            canDownloadOriginal: false,
                        });
                    });
                }
            });
        }

        if (permissionsToCreate.length === 0) {
            return res.status(200).json({
                message: "No default permissions configured, no permissions applied"
            });
        }

        // Apply permissions in a transaction
        await prisma.$transaction(async (tx) => {
            // First, remove any existing permissions for these documents and groups
            await tx.permissionGroupAccessControls.deleteMany({
                where: {
                    itemId: {
                        in: dataroomDocuments.map(doc => doc.id),
                    },
                    itemType: ItemType.DATAROOM_DOCUMENT,
                    groupId: {
                        in: permissionGroups.map(group => group.id),
                    },
                },
            });

            await tx.permissionGroupAccessControls.createMany({
                data: permissionsToCreate,
                skipDuplicates: true,
            });
        });

        res.status(200).json({
            message: "Default permissions applied successfully",
            appliedPermissions: permissionsToCreate.length,
            documentsProcessed: dataroomDocuments.length,
            groupsProcessed: permissionGroups.length,
        });

    } catch (error) {
        console.error("Error applying default permissions:", error);
        errorhandler(error, res);
    }
} 