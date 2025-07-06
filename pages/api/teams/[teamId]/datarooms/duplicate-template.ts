import { NextApiRequest, NextApiResponse } from "next";

import { getLimits } from "@/ee/limits/server";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import {
    Dataroom,
    DataroomBrand,
    DataroomDocument,
    DataroomFolder,
    Prisma,
} from "@prisma/client";
import { getServerSession } from "next-auth/next";

import { newId } from "@/lib/id-helper";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

interface DataroomWithContents extends Dataroom {
    documents: DataroomDocument[];
    folders: DataroomFolderWithContents[];
    brand: Partial<DataroomBrand> | null;
}

interface DataroomFolderWithContents extends DataroomFolder {
    documents: DataroomDocument[];
    childFolders: DataroomFolderWithContents[];
}

async function fetchTemplateDataroomContents(
    templateId: string,
): Promise<DataroomWithContents> {
    const dataroom = await prisma.dataroom.findFirst({
        where: {
            id: templateId,
            isTemplate: true,
        },
        include: {
            documents: true,
            folders: {
                where: { parentId: null },
                include: { documents: true },
            },
            brand: true,
        },
    });

    if (!dataroom) {
        throw new Error(`Template dataroom with id ${templateId} not found`);
    }

    // Recursive function to fetch folder contents
    async function getFolderContents(
        folderId: string,
    ): Promise<DataroomFolderWithContents> {
        const folder = await prisma.dataroomFolder.findUnique({
            where: { id: folderId },
            include: {
                documents: true,
                childFolders: {
                    include: { documents: true },
                },
            },
        });

        if (!folder) {
            throw new Error(`Folder with id ${folderId} not found`);
        }

        const childFolders = await Promise.all(
            folder.childFolders.map(async (childFolder) => {
                const nestedContents = await getFolderContents(childFolder.id);
                return nestedContents;
            }),
        );

        return {
            ...folder,
            documents: folder.documents,
            childFolders: childFolders,
        };
    }

    // Transform root folders by fetching their complete contents
    const foldersWithContents = await Promise.all(
        dataroom.folders.map((folder) => getFolderContents(folder.id)),
    );

    return {
        ...dataroom,
        documents: dataroom.documents.filter((doc) => !doc.folderId),
        folders: foldersWithContents,
        brand: dataroom.brand,
    };
}

// Recursive function to duplicate folders and documents
async function duplicateFolders(
    tx: Prisma.TransactionClient,
    dataroomId: string,
    folder: DataroomFolderWithContents,
    parentFolderId?: string,
) {
    const newFolder = await tx.dataroomFolder.create({
        data: {
            name: folder.name,
            path: folder.path,
            parentId: parentFolderId,
            dataroomId: dataroomId,
        },
        select: { id: true },
    });

    // Duplicate documents for the current folder
    const documentCreationResults = await Promise.allSettled(
        folder.documents.map((doc) =>
            tx.dataroomDocument.create({
                data: {
                    documentId: doc.documentId,
                    dataroomId: dataroomId,
                    folderId: newFolder.id,
                },
            }),
        ),
    );

    documentCreationResults.forEach((result) => {
        if (result.status === "rejected") {
            console.error(
                `Failed to create dataroom document for folder ${folder.name}:`,
                result.reason,
            );
        }
    });

    if (documentCreationResults.some((result) => result.status === "rejected")) {
        throw new Error("Failed to create one or more documents.");
    }

    // Duplicate child folders recursively
    const folderDuplicationResults = await Promise.allSettled(
        folder.childFolders.map((childFolder) =>
            duplicateFolders(tx, dataroomId, childFolder, newFolder.id),
        ),
    );

    folderDuplicationResults.forEach((result) => {
        if (result.status === "rejected") {
            console.error(
                `Failed to duplicate child folder for parent ${folder.name}:`,
                result.reason,
            );
        }
    });

    if (folderDuplicationResults.some((result) => result.status === "rejected")) {
        throw new Error("Failed to duplicate one or more folders.");
    }
}

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method === "POST") {
        // POST /api/teams/:teamId/datarooms/duplicate-template
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            res.status(401).end("Unauthorized");
            return;
        }

        const { teamId } = req.query as {
            teamId: string;
        };
        const { templateId, name } = req.body as {
            templateId: string;
            name?: string;
        };
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
                include: {
                    _count: {
                        select: {
                            datarooms: true,
                        },
                    },
                },
            });

            if (!team) {
                return res.status(401).end("Unauthorized");
            }
            const isTrial = team.plan.includes("drtrial");

            if (isTrial && team._count.datarooms >= 1) {
                return res.status(403).json({
                    message:
                        "You've reached the limit of datarooms. Consider upgrading your plan.",
                    info: "trial_limit_reached",
                });
            }

            const limits = await getLimits({ teamId, userId });

            if (limits && team._count.datarooms >= limits.datarooms && !isTrial) {
                console.log(
                    "Dataroom limit reached",
                    limits.datarooms,
                    team._count.datarooms,
                );
                return res.status(400).json({
                    message:
                        "You've reached the limit of datarooms. Consider upgrading your plan.",
                });
            }

            // Fetch the template dataroom structure
            const templateContents = await fetchTemplateDataroomContents(templateId);

            const pId = newId("dataroom");
            const newDataroom = await prisma.$transaction(async (tx) => {
                const createdDataroom = await tx.dataroom.create({
                    data: {
                        pId: pId,
                        name: name || `${templateContents.name} (Copy)`,
                        teamId: teamId,
                        documents: {
                            create: templateContents.documents.map((doc) => ({
                                documentId: doc.documentId,
                            })),
                        },
                        folders: {
                            create: [],
                        },
                    },
                });

                // Duplicate folders and their contents
                await Promise.all(
                    templateContents.folders
                        .filter((folder) => !folder.parentId)
                        .map((folder) =>
                            duplicateFolders(tx, createdDataroom.id, folder),
                        ),
                );

                return createdDataroom;
            });

            res.status(201).json(newDataroom);
        } catch (error) {
            console.error("Request error", error);
            res.status(500).json({ message: "Error creating dataroom from template" });
        }
    } else {
        // We only allow POST requests
        res.setHeader("Allow", ["POST"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 