-- Rename the table (this preserves all data)
ALTER TABLE "Conversation" RENAME TO "Chat";

-- Rename constraints and indices to match the new table name
ALTER INDEX "Conversation_pkey" RENAME TO "Chat_pkey";
ALTER INDEX "Conversation_threadId_key" RENAME TO "Chat_threadId_key";
ALTER INDEX "Conversation_threadId_idx" RENAME TO "Chat_threadId_idx";
ALTER INDEX "Conversation_userId_documentId_key" RENAME TO "Chat_userId_documentId_key";
ALTER INDEX "Conversation_threadId_documentId_key" RENAME TO "Chat_threadId_documentId_key";

-- Rename foreign key constraints
ALTER TABLE "Chat" RENAME CONSTRAINT "Conversation_userId_fkey" TO "Chat_userId_fkey";
ALTER TABLE "Chat" RENAME CONSTRAINT "Conversation_documentId_fkey" TO "Chat_documentId_fkey";
