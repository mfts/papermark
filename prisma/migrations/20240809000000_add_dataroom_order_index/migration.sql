-- AlterTable
ALTER TABLE "DataroomDocument" ADD COLUMN     "orderIndex" INTEGER;

-- AlterTable
ALTER TABLE "DataroomFolder" ADD COLUMN     "orderIndex" INTEGER;

-- CreateIndex
CREATE INDEX "DataroomDocument_dataroomId_folderId_orderIndex_idx" ON "DataroomDocument"("dataroomId", "folderId", "orderIndex");

-- CreateIndex
CREATE INDEX "DataroomFolder_dataroomId_parentId_orderIndex_idx" ON "DataroomFolder"("dataroomId", "parentId", "orderIndex");

