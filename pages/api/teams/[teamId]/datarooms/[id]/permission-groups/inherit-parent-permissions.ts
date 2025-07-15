import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { ItemType } from "@prisma/client";
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
        const { documentIds, folderPath } = req.body as {
            documentIds: string[];
            folderPath: string;
        };

        if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
            return res.status(400).json({ message: "Document IDs are required" });
        }

        if (!folderPath) {
            return res.status(400).json({ message: "Folder path is required" });
        }

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

        const permissionGroups = await prisma.permissionGroup.findMany({
            where: {
                dataroomId,
            },
            select: {
                id: true,
            },
        });

        if (permissionGroups.length === 0) {
            return res.status(200).json({
                message: "No permission groups found, no permissions applied"
            });
        }

        const pathSegments = folderPath.split("/").filter(Boolean);
        let parentFolder: { id: string } | null = null;
        let parentPath: string;

        if (pathSegments.length <= 1) {
            // since there's no parent to inherit from
            if (dataroom.defaultLinkPermission === "inherit_from_parent") {
                const permissionsToCreate: {
                    groupId: string;
                    itemId: string;
                    itemType: ItemType;
                    canView: boolean;
                    canDownload: boolean;
                    canDownloadOriginal: boolean;
                }[] = [];

                // Get dataroom documents for the provided document IDs
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
                    },
                });

                if (newDataroomDocuments.length === 0) {
                    return res.status(404).json({
                        message: "No documents found in this dataroom"
                    });
                }

                // For root level with inherit_from_parent, use canView: true, canDownload: false
                permissionGroups.forEach((group) => {
                    newDataroomDocuments.forEach((doc) => {
                        permissionsToCreate.push({
                            groupId: group.id,
                            itemId: doc.id,
                            itemType: ItemType.DATAROOM_DOCUMENT,
                            canView: true,
                            canDownload: false,
                            canDownloadOriginal: false,
                        });
                    });
                });

                // Apply false permissions in a transaction
                await prisma.$transaction(async (tx) => {
                    // First, remove any existing permissions for these documents and groups
                    await tx.permissionGroupAccessControls.deleteMany({
                        where: {
                            itemId: {
                                in: newDataroomDocuments.map(doc => doc.id),
                            },
                            itemType: ItemType.DATAROOM_DOCUMENT,
                            groupId: {
                                in: permissionGroups.map(group => group.id),
                            },
                        },
                    });

                    // Then create the false permissions
                    await tx.permissionGroupAccessControls.createMany({
                        data: permissionsToCreate,
                        skipDuplicates: true,
                    });
                });

                return res.status(200).json({
                    message: "View-only permissions applied for root-level folder (inherit_from_parent strategy)",
                    appliedPermissions: permissionsToCreate.length,
                    documentsProcessed: newDataroomDocuments.length,
                    groupsProcessed: permissionGroups.length,
                });
            } else {
                // For other strategies (use_default_permissions, use_simple_permissions), use default permissions
                const permissionsToCreate: {
                    groupId: string;
                    itemId: string;
                    itemType: ItemType;
                    canView: boolean;
                    canDownload: boolean;
                    canDownloadOriginal: boolean;
                }[] = [];

                // Get dataroom documents for the provided document IDs
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
                    },
                });

                if (newDataroomDocuments.length === 0) {
                    return res.status(404).json({
                        message: "No documents found in this dataroom"
                    });
                }

                // Get permission groups with their default permissions
                const permissionGroupsWithDefaults = await prisma.permissionGroup.findMany({
                    where: {
                        dataroomId,
                    },
                    select: {
                        id: true,
                        defaultCanView: true,
                        defaultCanDownload: true,
                    },
                });

                // Build permissions using appropriate strategy for root-level folder
                if (dataroom.defaultLinkPermission === "use_simple_permissions") {
                    // For simple permissions, use global dataroom settings for all groups
                    const globalCanView = dataroom.defaultLinkCanView ?? false;
                    const globalCanDownload = dataroom.defaultLinkCanDownload ?? false;

                    if (globalCanView || globalCanDownload) {
                        permissionGroupsWithDefaults.forEach((group) => {
                            newDataroomDocuments.forEach((doc) => {
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
                    permissionGroupsWithDefaults.forEach((group) => {
                        newDataroomDocuments.forEach((doc) => {
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
                    });
                }

                if (permissionsToCreate.length === 0) {
                    return res.status(200).json({
                        message: "No default permissions configured for permission groups"
                    });
                }

                // Apply default permissions in a transaction
                await prisma.$transaction(async (tx) => {
                    // First, remove any existing permissions for these documents and groups
                    await tx.permissionGroupAccessControls.deleteMany({
                        where: {
                            itemId: {
                                in: newDataroomDocuments.map(doc => doc.id),
                            },
                            itemType: ItemType.DATAROOM_DOCUMENT,
                            groupId: {
                                in: permissionGroupsWithDefaults.map(group => group.id),
                            },
                        },
                    });

                    // Then create the default permissions
                    await tx.permissionGroupAccessControls.createMany({
                        data: permissionsToCreate,
                        skipDuplicates: true,
                    });
                });

                return res.status(200).json({
                    message: "Default permissions applied for root-level folder",
                    appliedPermissions: permissionsToCreate.length,
                    documentsProcessed: newDataroomDocuments.length,
                    groupsProcessed: permissionGroupsWithDefaults.length,
                });
            }
        }

        // Get parent folder path for non-root folders
        parentPath = "/" + pathSegments.slice(0, -1).join("/");

        parentFolder = await prisma.dataroomFolder.findUnique({
            where: {
                dataroomId_path: {
                    dataroomId,
                    path: parentPath,
                },
            },
            select: {
                id: true,
            },
        });

        if (!parentFolder) {
            return res.status(404).json({
                message: "Parent folder not found"
            });
        }

        // Get dataroom documents for the provided document IDs
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
            },
        });

        if (newDataroomDocuments.length === 0) {
            return res.status(404).json({
                message: "No documents found in this dataroom"
            });
        }

        // Get all permissions for the parent folder
        const parentFolderPermissions = await prisma.permissionGroupAccessControls.findMany({
            where: {
                itemId: parentFolder.id,
                itemType: ItemType.DATAROOM_FOLDER,
                groupId: {
                    in: permissionGroups.map(group => group.id),
                },
            },
            select: {
                groupId: true,
                canView: true,
                canDownload: true,
                canDownloadOriginal: true,
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
            canDownloadOriginal: boolean;
        }[] = [];

        parentFolderPermissions.forEach((permission) => {
            newDataroomDocuments.forEach((doc) => {
                permissionsToCreate.push({
                    groupId: permission.groupId,
                    itemId: doc.id,
                    itemType: ItemType.DATAROOM_DOCUMENT,
                    canView: permission.canView,
                    canDownload: permission.canDownload,
                    canDownloadOriginal: permission.canDownloadOriginal,
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
            await tx.permissionGroupAccessControls.deleteMany({
                where: {
                    itemId: {
                        in: newDataroomDocuments.map(doc => doc.id),
                    },
                    itemType: ItemType.DATAROOM_DOCUMENT,
                    groupId: {
                        in: permissionGroups.map(group => group.id),
                    },
                },
            });

            // Then create the inherited permissions
            await tx.permissionGroupAccessControls.createMany({
                data: permissionsToCreate,
                skipDuplicates: true,
            });
        });

        res.status(200).json({
            message: "Parent permissions inherited successfully",
            appliedPermissions: permissionsToCreate.length,
            documentsProcessed: newDataroomDocuments.length,
            groupsProcessed: permissionGroups.length,
        });

    } catch (error) {
        console.error("Error inheriting parent permissions:", error);
        errorhandler(error, res);
    }
} 