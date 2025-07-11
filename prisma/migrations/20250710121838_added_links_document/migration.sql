-- DropIndex
DROP INDEX "Viewer_teamId_createdAt_idx";

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "contentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "DocumentVersion" ADD COLUMN     "contentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
