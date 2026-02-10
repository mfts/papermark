-- AlterTable
ALTER TABLE "Team"
ADD COLUMN "samlEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "samlProvider" TEXT,
ADD COLUMN "samlConnectionId" TEXT,
ADD COLUMN "scimEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "scimProvider" TEXT,
ADD COLUMN "scimDirectoryId" TEXT;
