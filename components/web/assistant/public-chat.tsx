import { type Message } from "ai/react";

import { Chat } from "@/components/chat/chat";

export default function ChatPage() {
  const initialMessages: Message[] = [];
  return (
    <>
      <Chat
        initialMessages={initialMessages}
        isPublic={true}
        className="h-[calc(100vh-180px)]"
        firstPage=""
      />
    </>
  );
}
