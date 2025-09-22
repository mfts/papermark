-- AlterTable
ALTER TABLE "RAGChatMessageMetadata" ADD COLUMN     "allocatedChunks" INTEGER,
ADD COLUMN     "avgRelevanceScore" DOUBLE PRECISION,
ADD COLUMN     "complexityScore" DOUBLE PRECISION,
ADD COLUMN     "contextEfficiency" DOUBLE PRECISION,
ADD COLUMN     "contextTokens" INTEGER,
ADD COLUMN     "modelUsed" TEXT,
ADD COLUMN     "queryTokens" INTEGER,
ADD COLUMN     "rerankInputCount" INTEGER,
ADD COLUMN     "rerankOutputCount" INTEGER,
ADD COLUMN     "rerankThreshold" INTEGER,
ADD COLUMN     "rerankTime" INTEGER,
ADD COLUMN     "strategyReasoning" TEXT,
ADD COLUMN     "temperature" DOUBLE PRECISION,
ADD COLUMN     "toolsEnabled" BOOLEAN,
ADD COLUMN     "totalSearchResults" INTEGER,
ADD COLUMN     "wasReranked" BOOLEAN;

-- CreateIndex
CREATE INDEX "RAGChatMessageMetadata_intent_idx" ON "RAGChatMessageMetadata"("intent");

-- CreateIndex
CREATE INDEX "RAGChatMessageMetadata_totalTokens_idx" ON "RAGChatMessageMetadata"("totalTokens");

-- CreateIndex
CREATE INDEX "RAGChatMessageMetadata_avgRelevanceScore_idx" ON "RAGChatMessageMetadata"("avgRelevanceScore");
