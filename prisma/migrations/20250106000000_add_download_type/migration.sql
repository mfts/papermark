-- CreateEnum
CREATE TYPE "DownloadType" AS ENUM ('SINGLE', 'BULK', 'FOLDER');

-- AlterTable
ALTER TABLE "View" ADD COLUMN "downloadType" "DownloadType";
ALTER TABLE "View" ADD COLUMN "downloadMetadata" JSONB;

