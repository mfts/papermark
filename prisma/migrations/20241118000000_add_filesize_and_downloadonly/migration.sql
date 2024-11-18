-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "downloadOnly" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "DocumentVersion" ADD COLUMN     "fileSize" INTEGER;

