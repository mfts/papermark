-- CreateEnum
CREATE TYPE "ViewType" AS ENUM ('DOCUMENT_VIEW', 'DATAROOM_VIEW');

-- AlterTable
ALTER TABLE "View" ADD COLUMN     "viewType" "ViewType" NOT NULL DEFAULT 'DOCUMENT_VIEW';

-- CreateIndex
CREATE INDEX "View_dataroomId_idx" ON "View"("dataroomId");

-- CreateIndex
CREATE INDEX "View_dataroomViewId_idx" ON "View"("dataroomViewId");

