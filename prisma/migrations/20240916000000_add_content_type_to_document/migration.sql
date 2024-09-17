-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "originalFile" TEXT;

-- AlterTable
ALTER TABLE "DocumentVersion" ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "originalFile" TEXT;

