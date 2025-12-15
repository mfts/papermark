-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Link_deletedAt_idx" ON "Link"("deletedAt" ASC);

