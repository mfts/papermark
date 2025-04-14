-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "isExternalUpload" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "enableUpload" BOOLEAN DEFAULT false,
ADD COLUMN     "isFileRequestOnly" BOOLEAN DEFAULT false,
ADD COLUMN     "uploadFolderId" TEXT;

-- CreateTable
CREATE TABLE "DocumentUpload" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "viewerId" TEXT,
    "viewId" TEXT,
    "linkId" TEXT NOT NULL,
    "dataroomId" TEXT,
    "dataroomDocumentId" TEXT,
    "originalFilename" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "numPages" INTEGER,

    CONSTRAINT "DocumentUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentUpload_dataroomDocumentId_idx" ON "DocumentUpload"("dataroomDocumentId" ASC);

-- CreateIndex
CREATE INDEX "DocumentUpload_dataroomId_idx" ON "DocumentUpload"("dataroomId" ASC);

-- CreateIndex
CREATE INDEX "DocumentUpload_documentId_idx" ON "DocumentUpload"("documentId" ASC);

-- CreateIndex
CREATE INDEX "DocumentUpload_linkId_idx" ON "DocumentUpload"("linkId" ASC);

-- CreateIndex
CREATE INDEX "DocumentUpload_teamId_idx" ON "DocumentUpload"("teamId" ASC);

-- CreateIndex
CREATE INDEX "DocumentUpload_viewId_idx" ON "DocumentUpload"("viewId" ASC);

-- CreateIndex
CREATE INDEX "DocumentUpload_viewerId_idx" ON "DocumentUpload"("viewerId" ASC);

-- AddForeignKey
ALTER TABLE "DocumentUpload" ADD CONSTRAINT "DocumentUpload_dataroomDocumentId_fkey" FOREIGN KEY ("dataroomDocumentId") REFERENCES "DataroomDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentUpload" ADD CONSTRAINT "DocumentUpload_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentUpload" ADD CONSTRAINT "DocumentUpload_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentUpload" ADD CONSTRAINT "DocumentUpload_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentUpload" ADD CONSTRAINT "DocumentUpload_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentUpload" ADD CONSTRAINT "DocumentUpload_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentUpload" ADD CONSTRAINT "DocumentUpload_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

