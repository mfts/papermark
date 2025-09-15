-- CreateEnum
CREATE TYPE "ParsingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "chunkingTimeMs" INTEGER,
ADD COLUMN     "doclingTimeMs" INTEGER,
ADD COLUMN     "documentSummary" TEXT,
ADD COLUMN     "embeddingTokenCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "markdownContent" TEXT,
ADD COLUMN     "markdownProcessedAt" TIMESTAMP(3),
ADD COLUMN     "ragIndexError" TEXT,
ADD COLUMN     "ragIndexingFinishedAt" TIMESTAMP(3),
ADD COLUMN     "ragIndexingProgress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "ragIndexingStartedAt" TIMESTAMP(3),
ADD COLUMN     "ragIndexingStatus" "ParsingStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "summaryModel" TEXT,
ADD COLUMN     "summaryProcessedAt" TIMESTAMP(3),
ADD COLUMN     "summaryTimeMs" INTEGER;

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
    "semanticType" TEXT,
    "level" INTEGER,
    "startLine" INTEGER,
    "endLine" INTEGER,
    "vectorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RAGChatSession" (
    "id" TEXT NOT NULL,
    "dataroomId" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "title" TEXT,
    "previewMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RAGChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RAGChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RAGChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RAGChatMessageMetadata" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "queryType" TEXT,
    "intent" TEXT,
    "complexityLevel" TEXT,
    "searchStrategy" TEXT,
    "strategyConfidence" DOUBLE PRECISION,
    "queryAnalysisTime" INTEGER,
    "searchTime" INTEGER,
    "responseTime" INTEGER,
    "totalTime" INTEGER,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "chunkIds" TEXT[],
    "documentIds" TEXT[],
    "pageRanges" TEXT[],
    "compressionStrategy" TEXT,
    "originalContextSize" INTEGER,
    "compressedContextSize" INTEGER,
    "errorType" TEXT,
    "errorMessage" TEXT,
    "isRetryable" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RAGChatMessageMetadata_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "DocumentChunk_semanticType_idx" ON "DocumentChunk"("semanticType");

-- CreateIndex
CREATE INDEX "DocumentChunk_level_idx" ON "DocumentChunk"("level");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentChunk_documentId_chunkIndex_key" ON "DocumentChunk"("documentId", "chunkIndex");

-- CreateIndex
CREATE INDEX "RAGChatSession_dataroomId_linkId_viewerId_createdAt_idx" ON "RAGChatSession"("dataroomId", "linkId", "viewerId", "createdAt");

-- CreateIndex
CREATE INDEX "RAGChatSession_linkId_viewerId_idx" ON "RAGChatSession"("linkId", "viewerId");

-- CreateIndex
CREATE INDEX "RAGChatSession_dataroomId_idx" ON "RAGChatSession"("dataroomId");

-- CreateIndex
CREATE INDEX "RAGChatMessage_sessionId_createdAt_idx" ON "RAGChatMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RAGChatMessageMetadata_messageId_key" ON "RAGChatMessageMetadata"("messageId");

-- CreateIndex
CREATE INDEX "RAGChatMessageMetadata_messageId_idx" ON "RAGChatMessageMetadata"("messageId");

-- CreateIndex
CREATE INDEX "RAGChatMessageMetadata_searchStrategy_idx" ON "RAGChatMessageMetadata"("searchStrategy");

-- CreateIndex
CREATE INDEX "RAGChatMessageMetadata_queryType_idx" ON "RAGChatMessageMetadata"("queryType");

-- CreateIndex
CREATE INDEX "RAGChatMessageMetadata_createdAt_idx" ON "RAGChatMessageMetadata"("createdAt");

-- CreateIndex
CREATE INDEX "Document_ragIndexingStatus_idx" ON "Document"("ragIndexingStatus");

-- CreateIndex
CREATE INDEX "Document_ragIndexingStartedAt_idx" ON "Document"("ragIndexingStartedAt");

-- AddForeignKey
ALTER TABLE "DataroomRAGSettings" ADD CONSTRAINT "DataroomRAGSettings_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RAGChatSession" ADD CONSTRAINT "RAGChatSession_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RAGChatSession" ADD CONSTRAINT "RAGChatSession_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RAGChatMessage" ADD CONSTRAINT "RAGChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RAGChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RAGChatMessageMetadata" ADD CONSTRAINT "RAGChatMessageMetadata_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "RAGChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
