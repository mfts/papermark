-- DropIndex
DROP INDEX "Chat_threadId_documentId_key";

-- DropIndex
DROP INDEX "Chat_threadId_idx";

-- DropIndex
DROP INDEX "Chat_threadId_key";

-- DropIndex
DROP INDEX "Chat_userId_documentId_key";

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "threadId",
ADD COLUMN     "dataroomId" TEXT,
ADD COLUMN     "linkId" TEXT,
ADD COLUMN     "teamId" TEXT NOT NULL,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vectorStoreId" TEXT,
ADD COLUMN     "viewId" TEXT,
ADD COLUMN     "viewerId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "documentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Dataroom" ADD COLUMN     "agentsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vectorStoreId" TEXT;

-- AlterTable
ALTER TABLE "DataroomDocument" ADD COLUMN     "vectorStoreFileId" TEXT;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "agentsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "DocumentVersion" ADD COLUMN     "vectorStoreFileId" TEXT;

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "enableAIAgents" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "agentsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vectorStoreId" TEXT;

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatMessage_chatId_createdAt_idx" ON "ChatMessage"("chatId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "ChatMessage_chatId_idx" ON "ChatMessage"("chatId" ASC);

-- CreateIndex
CREATE INDEX "Chat_createdAt_idx" ON "Chat"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Chat_dataroomId_idx" ON "Chat"("dataroomId" ASC);

-- CreateIndex
CREATE INDEX "Chat_documentId_idx" ON "Chat"("documentId" ASC);

-- CreateIndex
CREATE INDEX "Chat_linkId_idx" ON "Chat"("linkId" ASC);

-- CreateIndex
CREATE INDEX "Chat_teamId_idx" ON "Chat"("teamId" ASC);

-- CreateIndex
CREATE INDEX "Chat_userId_idx" ON "Chat"("userId" ASC);

-- CreateIndex
CREATE INDEX "Chat_viewId_idx" ON "Chat"("viewId" ASC);

-- CreateIndex
CREATE INDEX "Chat_viewerId_idx" ON "Chat"("viewerId" ASC);

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

