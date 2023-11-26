"use client";

import {
  experimental_useAssistant as useAssistant,
  type Message,
} from "ai/react";

import { cn } from "@/lib/utils";
import { ChatList } from "@/components/chat/chat-list";
import { ChatInput } from "@/components/chat/chat-input";
// import { EmptyScreen } from "@/components/empty-screen";
import { ChatScrollAnchor } from "@/components/chat/chat-scroll-anchor";
import { useEffect, useState } from "react";

export interface ChatProps extends React.ComponentProps<"div"> {
  initialMessages: Message[];
  threadId: string;
}

export function Chat({ initialMessages, threadId, className }: ChatProps) {
  const {
    status,
    messages: hookMessages,
    input,
    submitMessage,
    handleInputChange,
    error,
  } = useAssistant({
    api: "/api/assistants/chat",
    threadId: threadId,
  });

  const [combinedMessages, setCombinedMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Concatenate existing messages with messages from the hook
    // and reverse the order so that the newest messages are at the bottom:
    const reversedMessages = [...initialMessages].reverse();
    setCombinedMessages([...reversedMessages, ...hookMessages]);
  }, [initialMessages, hookMessages]);

  let isLoading;
  if (status === "in_progress") {
    isLoading = true;
  } else if (status === "awaiting_message") {
    isLoading = true;
  }

  return (
    <>
      <Nav />
      <div className={cn("pb-[100px] pt-24", className)}>
        {combinedMessages.length ? (
          <>
            <ChatList messages={combinedMessages} status={status} />
            <ChatScrollAnchor trackVisibility={isLoading} />
          </>
        ) : // <EmptyScreen handleInputChange={handleInputChange} />
        null}
      </div>
      <ChatInput
        status={status}
        error={error}
        messages={combinedMessages}
        input={input}
        submitMessage={submitMessage}
        handleInputChange={handleInputChange}
      />
    </>
  );
}

function Nav() {
  return (
    <nav className="bg-black fixed top-0 inset-x-0 z-10">
      <div className="mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex flex-shrink-0 items-center">
              <p className="text-2xl font-bold tracking-tighter text-white">
                Papermark
              </p>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <div className="bg-gray-900 text-white rounded-md px-3 py-2 text-sm font-medium">
              {/* <span>{pageNumber}</span>
              <span className="text-gray-400"> / {numPages}</span> */}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
