-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "rootRedirect" TEXT;

-- CreateIndex
CREATE INDEX "Domain_slug_idx" ON "Domain"("slug");
