-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "ownerId" TEXT;

-- CreateIndex
CREATE INDEX "Link_ownerId_idx" ON "Link"("ownerId" ASC);

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

