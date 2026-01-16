-- AlterTable
ALTER TABLE "Document" ADD COLUMN "hiddenInAllDocuments" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN "hiddenInAllDocuments" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Document_teamId_hiddenInAllDocuments_idx" ON "Document"("teamId", "hiddenInAllDocuments");

-- CreateIndex
CREATE INDEX "Folder_teamId_hiddenInAllDocuments_idx" ON "Folder"("teamId", "hiddenInAllDocuments");
