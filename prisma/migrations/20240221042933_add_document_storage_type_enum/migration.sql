-- CreateEnum
CREATE TYPE "DocumentStorageType" AS ENUM ('S3_PATH', 'VERCEL_BLOB');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "storageType" "DocumentStorageType" NOT NULL DEFAULT 'VERCEL_BLOB';

-- AlterTable
ALTER TABLE "DocumentPage" ADD COLUMN     "storageType" "DocumentStorageType" NOT NULL DEFAULT 'VERCEL_BLOB';

-- AlterTable
ALTER TABLE "DocumentVersion" ADD COLUMN     "storageType" "DocumentStorageType" NOT NULL DEFAULT 'VERCEL_BLOB';
