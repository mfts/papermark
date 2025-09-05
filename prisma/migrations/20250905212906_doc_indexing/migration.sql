-- CreateEnum
CREATE TYPE "ParsingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "embeddingTokenCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "markdownContent" TEXT,
ADD COLUMN     "markdownProcessedAt" TIMESTAMP(3),
ADD COLUMN     "ragIndexError" TEXT,
ADD COLUMN     "ragIndexingFinishedAt" TIMESTAMP(3),
ADD COLUMN     "ragIndexingProgress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "ragIndexingStartedAt" TIMESTAMP(3),
ADD COLUMN     "ragIndexingStatus" "ParsingStatus" NOT NULL DEFAULT 'NOT_STARTED';

-- CreateTable
CREATE TABLE "DataroomRAGSettings" (
    "id" TEXT NOT NULL,
    "dataroomId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "ragIndexingStatus" "ParsingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "indexingStartedAt" TIMESTAMP(3),
    "indexingCompletedAt" TIMESTAMP(3),
    "indexingProgress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "indexingError" TEXT,
    "totalEmbeddingTokens" INTEGER NOT NULL DEFAULT 0,
    "totalProcessingTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataroomRAGSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "chunkHash" TEXT NOT NULL,
    "dataroomId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "contentType" TEXT,
    "pageRanges" TEXT,
    "tokenCount" INTEGER,
    "sectionHeader" TEXT,
    "headerHierarchy" TEXT,
    "isSmallChunk" BOOLEAN,
    "vectorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataroomRAGSettings_dataroomId_key" ON "DataroomRAGSettings"("dataroomId");

-- CreateIndex
CREATE INDEX "DataroomRAGSettings_enabled_idx" ON "DataroomRAGSettings"("enabled");

-- CreateIndex
CREATE INDEX "DataroomRAGSettings_ragIndexingStatus_idx" ON "DataroomRAGSettings"("ragIndexingStatus");

-- CreateIndex
CREATE INDEX "DataroomRAGSettings_indexingStartedAt_idx" ON "DataroomRAGSettings"("indexingStartedAt");

-- CreateIndex
CREATE INDEX "DocumentChunk_documentId_idx" ON "DocumentChunk"("documentId");

-- CreateIndex
CREATE INDEX "DocumentChunk_dataroomId_idx" ON "DocumentChunk"("dataroomId");

-- CreateIndex
CREATE INDEX "DocumentChunk_teamId_idx" ON "DocumentChunk"("teamId");

-- CreateIndex
CREATE INDEX "DocumentChunk_chunkHash_idx" ON "DocumentChunk"("chunkHash");

-- CreateIndex
CREATE INDEX "DocumentChunk_vectorId_idx" ON "DocumentChunk"("vectorId");

-- CreateIndex
CREATE INDEX "DocumentChunk_sectionHeader_idx" ON "DocumentChunk"("sectionHeader");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentChunk_documentId_chunkIndex_key" ON "DocumentChunk"("documentId", "chunkIndex");

-- CreateIndex
CREATE INDEX "Document_ragIndexingStatus_idx" ON "Document"("ragIndexingStatus");

-- CreateIndex
CREATE INDEX "Document_ragIndexingStartedAt_idx" ON "Document"("ragIndexingStartedAt");

-- AddForeignKey
ALTER TABLE "DataroomRAGSettings" ADD CONSTRAINT "DataroomRAGSettings_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
