-- AlterTable
ALTER TABLE "Team" ADD COLUMN "samlEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Team" ADD COLUMN "samlProvider" TEXT;
ALTER TABLE "Team" ADD COLUMN "samlConnectionId" TEXT;
ALTER TABLE "Team" ADD COLUMN "scimEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Team" ADD COLUMN "scimProvider" TEXT;
ALTER TABLE "Team" ADD COLUMN "scimDirectoryId" TEXT;
