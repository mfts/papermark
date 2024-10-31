-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('USER', 'VIEWER');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "ownerType" "OwnerType" NOT NULL DEFAULT 'USER',
ADD COLUMN     "ownerViewerId" TEXT;

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "allowDocUpload" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Document_ownerViewerId_idx" ON "Document"("ownerViewerId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ownerViewerId_fkey" FOREIGN KEY ("ownerViewerId") REFERENCES "Viewer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
