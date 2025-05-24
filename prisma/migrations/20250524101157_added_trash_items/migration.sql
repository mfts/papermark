-- AlterTable
ALTER TABLE "DataroomDocument" ADD COLUMN     "removedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DataroomFolder" ADD COLUMN     "removedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TrashItem" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemType" "ItemType" NOT NULL,
    "dataroomId" TEXT NOT NULL,
    "dataroomDocumentId" TEXT,
    "dataroomFolderId" TEXT,
    "fullPath" TEXT,
    "trashPath" TEXT,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedBy" TEXT NOT NULL,
    "purgeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrashItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrashItem_dataroomId_idx" ON "TrashItem"("dataroomId");

-- CreateIndex
CREATE INDEX "TrashItem_dataroomDocumentId_idx" ON "TrashItem"("dataroomDocumentId");

-- CreateIndex
CREATE INDEX "TrashItem_dataroomFolderId_idx" ON "TrashItem"("dataroomFolderId");

-- CreateIndex
CREATE INDEX "TrashItem_itemType_itemId_idx" ON "TrashItem"("itemType", "itemId");

-- CreateIndex
CREATE INDEX "TrashItem_deletedAt_idx" ON "TrashItem"("deletedAt");

-- CreateIndex
CREATE INDEX "TrashItem_purgeAt_idx" ON "TrashItem"("purgeAt");

-- CreateIndex
CREATE INDEX "TrashItem_dataroomId_parentId_itemType_idx" ON "TrashItem"("dataroomId", "parentId", "itemType");

-- CreateIndex
CREATE UNIQUE INDEX "TrashItem_dataroomId_itemId_key" ON "TrashItem"("dataroomId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "TrashItem_dataroomId_dataroomFolderId_key" ON "TrashItem"("dataroomId", "dataroomFolderId");

-- CreateIndex
CREATE UNIQUE INDEX "TrashItem_dataroomId_dataroomDocumentId_key" ON "TrashItem"("dataroomId", "dataroomDocumentId");

-- AddForeignKey
ALTER TABLE "TrashItem" ADD CONSTRAINT "TrashItem_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrashItem" ADD CONSTRAINT "TrashItem_dataroomDocumentId_fkey" FOREIGN KEY ("dataroomDocumentId") REFERENCES "DataroomDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrashItem" ADD CONSTRAINT "TrashItem_dataroomFolderId_fkey" FOREIGN KEY ("dataroomFolderId") REFERENCES "DataroomFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
