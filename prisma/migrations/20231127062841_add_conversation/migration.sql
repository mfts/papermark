-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "assistantEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "DocumentVersion" ADD COLUMN     "fileId" TEXT;

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_threadId_key" ON "Conversation"("threadId");

-- CreateIndex
CREATE INDEX "Conversation_threadId_idx" ON "Conversation"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_userId_documentId_key" ON "Conversation"("userId", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_threadId_documentId_key" ON "Conversation"("threadId", "documentId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
