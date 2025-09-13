-- AlterTable
ALTER TABLE "RAGChatSession" ADD COLUMN     "previewMessage" TEXT;

-- AddForeignKey
ALTER TABLE "RAGChatSession" ADD CONSTRAINT "RAGChatSession_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RAGChatSession" ADD CONSTRAINT "RAGChatSession_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
