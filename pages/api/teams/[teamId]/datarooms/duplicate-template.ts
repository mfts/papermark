import { NextApiRequest, NextApiResponse } from "next";

import { getLimits } from "@/ee/limits/server";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import {
    Dataroom,
    DataroomBrand,
    DataroomDocument,
    DataroomFolder,
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

// Template dataroom IDs from Papermark Templates account
const TEMPLATE_DATAROOM_IDS = [
    "cmclsvtli0001jp04xhvtsbc8",
    "cmcnpybt1000sjx04zz2p34kn",
];

async function fetchTemplateDataroomContents(
    templateId: string,
): Promise<DataroomWithContents> {

    if (!TEMPLATE_DATAROOM_IDS.includes(templateId)) {
        throw new Error(`Invalid template ID: ${templateId}`);
    }

    const dataroom = await prisma.dataroom.findUnique({
        where: { id: templateId },
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
    dataroomId: string,
    folder: DataroomFolderWithContents,
    parentFolderId?: string,
) {
    const newFolder = await prisma.dataroomFolder.create({
        data: {
            name: folder.name,
            path: folder.path,
            parentId: parentFolderId,
            dataroomId: dataroomId,
        },
        select: { id: true },
    });

    // Duplicate documents for the current folder
    await Promise.allSettled(
        folder.documents.map((doc) =>
            prisma.dataroomDocument.create({
                data: {
                    documentId: doc.documentId,
                    dataroomId: dataroomId,
                    folderId: newFolder.id,
                },
            }),
        ),
    );

    // Duplicate child folders recursively
    await Promise.allSettled(
        folder.childFolders.map((childFolder) =>
            duplicateFolders(dataroomId, childFolder, newFolder.id),
        ),
    );
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

            // Create a new data room from the template
            const pId = newId("dataroom");
            const newDataroom = await prisma.dataroom.create({
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
                    .map((folder) => duplicateFolders(newDataroom.id, folder)),
            );

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