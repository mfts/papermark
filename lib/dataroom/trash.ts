import { ItemType, Prisma } from "@prisma/client";

const TRASH_RETENTION_DAYS = 30;

const calculatePurgeDate = (): Date => {
    const purgeDate = new Date();
    purgeDate.setDate(purgeDate.getDate() + TRASH_RETENTION_DAYS);
    return purgeDate;
};

export interface CreateTrashItemInput {
    itemId: string;
    itemType: ItemType;
    dataroomId: string;
    name: string;
    fullPath: string | null;
    userId: string;
    dataroomDocumentId?: string;
    dataroomFolderId?: string;
    trashPath: string | null;
    parentId?: string | null;
}

export async function createTrashItem(tx: Prisma.TransactionClient, {
    itemId,
    itemType,
    dataroomId,
    name,
    fullPath,
    userId,
    dataroomDocumentId,
    dataroomFolderId,
    trashPath,
    parentId,
}: CreateTrashItemInput) {
    return await tx.trashItem.create({
        data: {
            itemId,
            itemType,
            dataroomId,
            name,
            fullPath,
            parentId,
            deletedBy: userId,
            purgeAt: calculatePurgeDate(),
            trashPath: trashPath,
            ...(dataroomDocumentId && { dataroomDocumentId }),
            ...(dataroomFolderId && { dataroomFolderId }),
        },
    });
} 