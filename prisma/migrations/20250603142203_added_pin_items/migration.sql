-- CreateEnum
CREATE TYPE "PinType" AS ENUM ('DOCUMENT', 'FOLDER', 'DATAROOM', 'DATAROOM_DOCUMENT', 'DATAROOM_FOLDER');

-- CreateTable
CREATE TABLE "Pin" (
    "id" TEXT NOT NULL,
    "pinType" "PinType" NOT NULL,
    "documentId" TEXT,
    "folderId" TEXT,
    "dataroomId" TEXT,
    "dataroomDocumentId" TEXT,
    "dataroomFolderId" TEXT,
    "teamId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pin_teamId_idx" ON "Pin"("teamId");

-- CreateIndex
CREATE INDEX "Pin_orderIndex_idx" ON "Pin"("orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Pin_documentId_teamId_key" ON "Pin"("documentId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Pin_folderId_teamId_key" ON "Pin"("folderId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Pin_dataroomId_teamId_key" ON "Pin"("dataroomId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Pin_dataroomDocumentId_teamId_key" ON "Pin"("dataroomDocumentId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Pin_dataroomFolderId_teamId_key" ON "Pin"("dataroomFolderId", "teamId");

-- AddForeignKey
ALTER TABLE "Pin" ADD CONSTRAINT "Pin_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pin" ADD CONSTRAINT "Pin_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pin" ADD CONSTRAINT "Pin_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pin" ADD CONSTRAINT "Pin_dataroomDocumentId_fkey" FOREIGN KEY ("dataroomDocumentId") REFERENCES "DataroomDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pin" ADD CONSTRAINT "Pin_dataroomFolderId_fkey" FOREIGN KEY ("dataroomFolderId") REFERENCES "DataroomFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pin" ADD CONSTRAINT "Pin_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
