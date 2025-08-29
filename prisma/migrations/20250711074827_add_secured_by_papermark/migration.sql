-- DropIndex
DROP INDEX "Viewer_teamId_createdAt_idx";

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "securedByPapermark" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "LinkPreset" ADD COLUMN     "securedByPapermark" BOOLEAN DEFAULT false;
