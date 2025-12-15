-- AlterTable
ALTER TABLE "Dataroom" ADD COLUMN     "showLastUpdated" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "welcomeMessage" TEXT;

-- AlterTable
ALTER TABLE "LinkPreset" ADD COLUMN     "welcomeMessage" TEXT;

