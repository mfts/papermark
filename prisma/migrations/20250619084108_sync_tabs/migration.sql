-- AlterTable
ALTER TABLE "UserTeam" ADD COLUMN     "tabsLastUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DocumentTab" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTab_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentTab_documentId_idx" ON "DocumentTab"("documentId");

-- CreateIndex
CREATE INDEX "DocumentTab_userId_teamId_idx" ON "DocumentTab"("userId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTab_userId_teamId_documentId_key" ON "DocumentTab"("userId", "teamId", "documentId");

-- AddForeignKey
ALTER TABLE "DocumentTab" ADD CONSTRAINT "DocumentTab_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTab" ADD CONSTRAINT "DocumentTab_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTab" ADD CONSTRAINT "DocumentTab_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
