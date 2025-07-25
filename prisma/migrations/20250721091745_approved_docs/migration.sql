/*
  Warnings:

  - A unique constraint covering the columns `[documentId]` on the table `DocumentUpload` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DocumentApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "DocumentUpload" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "approvedStatus" "DocumentApprovalStatus" DEFAULT 'PENDING',
ADD COLUMN     "requireApproval" BOOLEAN DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "DocumentUpload_documentId_key" ON "DocumentUpload"("documentId");
