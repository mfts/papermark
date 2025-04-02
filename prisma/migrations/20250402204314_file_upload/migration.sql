-- CreateEnum
CREATE TYPE "DocumentApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "LinkType" ADD VALUE 'FILE_REQUEST_LINK';

-- AlterEnum
ALTER TYPE "ViewType" ADD VALUE 'FILE_REQUEST_VIEW';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "approvalStatus" "DocumentApprovalStatus",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "uploadedViaLinkId" TEXT,
ADD COLUMN     "viewerId" TEXT;

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "maxFiles" INTEGER DEFAULT 1,
ADD COLUMN     "requireApproval" BOOLEAN DEFAULT false,
ADD COLUMN     "uploadDataroomFolderId" TEXT,
ADD COLUMN     "uploadFolderId" TEXT;

-- AlterTable
ALTER TABLE "View" ADD COLUMN     "uploadDataroomFolderId" TEXT,
ADD COLUMN     "uploadDocumentIds" TEXT[],
ADD COLUMN     "uploadFolderId" TEXT;

-- CreateIndex
CREATE INDEX "Document_viewerId_idx" ON "Document"("viewerId");

-- CreateIndex
CREATE INDEX "Document_uploadedViaLinkId_idx" ON "Document"("uploadedViaLinkId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedViaLinkId_fkey" FOREIGN KEY ("uploadedViaLinkId") REFERENCES "Link"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_uploadFolderId_fkey" FOREIGN KEY ("uploadFolderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_uploadDataroomFolderId_fkey" FOREIGN KEY ("uploadDataroomFolderId") REFERENCES "DataroomFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_uploadFolderId_fkey" FOREIGN KEY ("uploadFolderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_uploadDataroomFolderId_fkey" FOREIGN KEY ("uploadDataroomFolderId") REFERENCES "DataroomFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
