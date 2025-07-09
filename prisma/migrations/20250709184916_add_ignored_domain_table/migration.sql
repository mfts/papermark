-- DropIndex
DROP INDEX "Viewer_teamId_createdAt_idx";

-- CreateTable
CREATE TABLE "IgnoredDomain" (
    "id" TEXT NOT NULL,
    "domains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IgnoredDomain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IgnoredDomain_teamId_idx" ON "IgnoredDomain"("teamId");

-- AddForeignKey
ALTER TABLE "IgnoredDomain" ADD CONSTRAINT "IgnoredDomain_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
