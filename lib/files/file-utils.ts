import prisma from "@/lib/prisma";
import { logger } from "@trigger.dev/sdk/v3";

export async function createFolderRecord({
    dataroomId,
    name,
    path,
    teamId,
    googleDriveFolderId,
    parentId,
}: {
    dataroomId: string | null;
    name: string;
    path: string;
    teamId: string;
    googleDriveFolderId: string;
    parentId: string | null;
}) {
    logger.info("Creating folder record", { dataroomId, name, path, teamId, googleDriveFolderId, parentId });
    if (dataroomId) {
        return prisma.dataroomFolder.create({
            data: { name, path, dataroomId, parentId: parentId ?? null, googleDriveFolderId }
        });
    } else {
        return prisma.folder.create({
            data: { name, path, teamId, googleDriveFolderId, parentId }
        });
    }
}



export async function findFolderRecord({
    name,
    teamId,
    parentId,
    dataroomId,
    path,
}: {
    name: string;
    teamId: string;
    parentId: string | null;
    dataroomId: string | null;
    path?: string;
}) {
    logger.info("Finding folder record", { name, teamId, parentId, dataroomId, path });
    if (dataroomId) {
        return prisma.dataroomFolder.findUnique({
            where: { dataroomId_path: { dataroomId, path: path ?? "" } }
        });
    } else {
        return prisma.folder.findFirst({ where: { name, teamId, parentId: parentId ?? null } });
    }
};

export async function findFolderRecordByPath({
    path,
    teamId,
    dataroomId,
}: {
    path: string;
    teamId: string;
    dataroomId: string | null;
}) {
    if (dataroomId) {
        return prisma.dataroomFolder.findUnique({
            where: { dataroomId_path: { dataroomId, path: path } },
            select: { id: true }
        });
    } else {
        return prisma.folder.findFirst({
            where: { path: path, teamId: teamId },
            select: { id: true }
        });
    }
}