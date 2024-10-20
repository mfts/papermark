-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "teamId" TEXT;

-- AlterTable
ALTER TABLE "View" ADD COLUMN     "teamId" TEXT;

-- CreateIndex
CREATE INDEX "Link_teamId_idx" ON "Link"("teamId");

-- CreateIndex
CREATE INDEX "View_teamId_idx" ON "View"("teamId");

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

