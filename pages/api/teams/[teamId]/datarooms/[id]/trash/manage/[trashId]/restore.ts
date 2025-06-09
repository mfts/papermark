import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { ItemType } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import { getTrashItemsInFolderHierarchy } from "@/lib/api/dataroom/trash-utils";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method === "PUT") {
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            res.status(401).end("Unauthorized");
            return;
        }

        const {
            teamId,
            id: dataroomId,
            trashId,
        } = req.query as {
            teamId: string;
            id: string;
            trashId: string;
        };

        if (!trashId) {
            return res.status(400).end("Selected item not found");
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

            const trashItem = await prisma.trashItem.findFirst({
                where: {
                    id: trashId,
                    dataroomId: dataroomId,
                },
                select: {
                    id: true,
                    itemId: true,
                    itemType: true,
                    dataroomFolderId: true,
                    dataroomDocumentId: true,
                    dataroomFolder: {
                        select: {
                            id: true,
                            parentId: true,
                        },
                    },
                    dataroomDocument: {
                        select: {
                            id: true,
                            folderId: true,
                        },
                    },
                },
            });


            if (!trashItem) {
                return res.status(404).json({
                    message: "Trash item not found",
                });
            }

            if (trashItem.itemType === ItemType.DATAROOM_FOLDER && trashItem.dataroomFolder?.parentId) {
                const parentFolder = await prisma.dataroomFolder.findUnique({
                    where: {
                        id: trashItem.dataroomFolder.parentId,
                    },
                    select: {
                        id: true,
                        removedAt: true,
                    },
                });

                if (!parentFolder || parentFolder.removedAt !== null) {
                    return res.status(400).json({
                        message: "Cannot restore item because its original location no longer exists",
                    });
                }
            }

            if (trashItem.itemType === ItemType.DATAROOM_DOCUMENT && trashItem.dataroomDocument?.folderId) {
                const parentFolder = await prisma.dataroomFolder.findUnique({
                    where: {
                        id: trashItem.dataroomDocument.folderId,
                    },
                    select: {
                        id: true,
                        removedAt: true,
                    },
                });

                if (!parentFolder || parentFolder.removedAt !== null) {
                    return res.status(400).json({
                        message: "Cannot restore item because its original location no longer exists",
                    });
                }
            }

            await prisma.$transaction(async (tx) => {
                if (
                    trashItem.itemType === ItemType.DATAROOM_FOLDER &&
                    trashItem.dataroomFolderId
                ) {
                    const trashItemsToRestore = await getTrashItemsInFolderHierarchy(
                        trashItem.dataroomFolderId,
                        dataroomId,
                        tx,
                        trashItem,
                    );

                    for (const item of trashItemsToRestore) {
                        if (
                            item.itemType === ItemType.DATAROOM_DOCUMENT &&
                            item.dataroomDocumentId
                        ) {
                            await tx.dataroomDocument.update({
                                where: {
                                    id: item.dataroomDocumentId,
                                    dataroomId: dataroomId,
                                },
                                data: {
                                    removedAt: null,
                                },
                            });
                        } else if (
                            item.itemType === ItemType.DATAROOM_FOLDER &&
                            item.dataroomFolderId
                        ) {
                            await tx.dataroomFolder.update({
                                where: {
                                    id: item.dataroomFolderId,
                                },
                                data: {
                                    removedAt: null,
                                },
                            });
                        }

                        await tx.trashItem.delete({
                            where: {
                                id: item.id,
                                dataroomId: dataroomId,
                            },
                        });
                    }
                } else if (
                    trashItem.itemType === ItemType.DATAROOM_DOCUMENT &&
                    trashItem.dataroomDocumentId
                ) {
                    await tx.dataroomDocument.update({
                        where: {
                            id: trashItem.dataroomDocumentId,
                            dataroomId: dataroomId,
                        },
                        data: {
                            removedAt: null,
                        },
                    });

                    await tx.trashItem.delete({
                        where: {
                            id: trashItem.id,
                            dataroomId: dataroomId,
                        },
                    });
                }
            });

            return res.status(200).json({ message: "Items restored successfully" });
        } catch (error) {
            errorhandler(error, res);
        }
    } else {
        res.setHeader("Allow", ["PUT"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
