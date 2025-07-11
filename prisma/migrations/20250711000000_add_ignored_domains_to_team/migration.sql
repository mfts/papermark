-- DropIndex
DROP INDEX IF EXISTS "Viewer_teamId_createdAt_idx";

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "ignoredDomains" TEXT[];

