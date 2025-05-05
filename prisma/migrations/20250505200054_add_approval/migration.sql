-- CreateEnum
CREATE TYPE "DocumentApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "approvedStatus" "DocumentApprovalStatus",
ADD COLUMN     "requireApproval" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "requireAdminApproval" BOOLEAN DEFAULT true;
