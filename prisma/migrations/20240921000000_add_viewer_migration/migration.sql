-- DropForeignKey
ALTER TABLE "Viewer" DROP CONSTRAINT "Viewer_dataroomId_fkey";

-- DropIndex
DROP INDEX "Viewer_dataroomId_email_key";

-- AlterTable
ALTER TABLE "Viewer" ALTER COLUMN "dataroomId" DROP NOT NULL,
ALTER COLUMN "teamId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Viewer_teamId_email_key" ON "Viewer"("teamId", "email");

-- AddForeignKey
ALTER TABLE "Viewer" ADD CONSTRAINT "Viewer_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

