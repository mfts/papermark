import { ItemType } from "@prisma/client";

export interface TrashItemDocument {
    id: string;
    removedAt: string;
    document: {
        id: string;
        name: string;
        type: string;
    };
}

export interface TrashItemFolder {
    id: string;
    name: string;
    path: string;
    parentId: string | null;
    dataroomId: string;
    orderIndex: number | null;
    removedAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface TrashItem {
    id: string;
    itemType: ItemType;
    parentId: string | null;
    trashPath: string | null;
    fullPath: string | null;
    itemId: string;
    dataroomFolder: TrashItemFolder | null;
    dataroomDocument: TrashItemDocument | null;
}
