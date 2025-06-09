import { ItemType, Prisma } from "@prisma/client";

export type TrashItemWithData = {
    id: string;
    itemType: ItemType;
    dataroomFolderId: string | null;
    dataroomDocumentId: string | null;
};

export async function getTrashItemsInFolderHierarchy(
    folderId: string,
    dataroomId: string,
    tx: Prisma.TransactionClient,
    existingTrashItem: TrashItemWithData,
): Promise<TrashItemWithData[]> {
    const result = new Map<string, TrashItemWithData>();


    // Add the existing trash item to the result
    result.set(existingTrashItem.id, existingTrashItem);


    async function collectTrashItems(currentFolderId: string) {
        const trashItems = await tx.trashItem.findMany({
            where: {
                dataroomId,
                parentId: currentFolderId,
            },
            select: {
                id: true,
                itemType: true,
                dataroomFolderId: true,
                dataroomDocumentId: true,
                parentId: true,
            },
        });

        trashItems.forEach((item) => result.set(item.id, item));

        const childFolders = trashItems.filter(
            (item) => item.itemType === ItemType.DATAROOM_FOLDER,
        );

        for (const folder of childFolders) {
            if (folder.dataroomFolderId) {
                await collectTrashItems(folder.dataroomFolderId);
            }
        }
    }

    await collectTrashItems(folderId);
    return Array.from(result.values());
} 