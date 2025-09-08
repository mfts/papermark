"use client";

import { ChatContainer } from "./chat-container";

interface RAGChatProps {
  dataroomId: string;
  viewerId: string;
  linkId: string;
  documents?: Array<{
    id: string;
    name: string;
    folderId: string | null;
  }>;
  folders?: Array<{
    id: string;
    name: string;
    parentId: string | null;
  }>;
}

export function RAGChatInterface({
  dataroomId,
  viewerId,
  linkId,
  documents = [],
  folders = [],
}: RAGChatProps) {
  return (
    <ChatContainer
      dataroomId={dataroomId}
      viewerId={viewerId}
      linkId={linkId}
      apiEndpoint="/api/rag/chat"
      placeholder="Ask about your documents..."
      // showDocuments={true}
      maxHeight="100vh"
      className="h-full"
      documents={documents}
      folders={folders}
    />
  );
}
