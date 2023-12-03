"use client";

import {
  experimental_useAssistant as useAssistant,
  type Message,
} from "ai/react";

import { cn } from "@/lib/utils";
import { ChatList } from "./chat-list";
import { ChatInput } from "./chat-input";
import { ChatScrollAnchor } from "./chat-scroll-anchor";
import { EmptyScreen } from "./empty-screen";
import { useEffect, useState } from "react";
import { nanoid } from "nanoid";

export interface ChatProps extends React.ComponentProps<"div"> {
  initialMessages: Message[];
  threadId?: string;
  firstPage?: string;
  isPublic?: boolean;
  userId?: string;
  plan?: string;
}

export function Chat({
  initialMessages,
  threadId,
  firstPage,
  className,
  isPublic,
  userId,
  plan,
}: ChatProps) {
  const {
    status,
    messages: hookMessages,
    input: hookInput,
    submitMessage,
    handleInputChange,
    error,
  } = useAssistant({
    api: "/api/assistants/chat",
    threadId: threadId,
    body: {
      isPublic: isPublic,
      userId: userId,
      plan: plan,
    },
  });

  const [combinedMessages, setCombinedMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (error instanceof Error) {
      let content: string = "";
      if (isPublic) {
        content =
          "You have reached your request limit for the day. Sign up for a free account to continue using Papermark Assistant.";
      }
      if (userId && plan !== "pro") {
        content =
          "You have reached your request limit for the day. Upgrade to a paid account to continue using Papermark Assistant.";
      }

      const message: Message = {
        role: "system",
        content: content,
        id: nanoid(),
      };

      setCombinedMessages((prev) => [...prev, message]);
    }
  }, [error]);

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

  const [_, setInput] = useState<string>(hookInput);

  return (
    <>
      <div
        className={cn(
          "pb-[20px] pt-24 h-[calc(100vh-96px)] relative overflow-y-auto",
          className,
        )}
      >
        {combinedMessages.length ? (
          <>
            <ChatList messages={combinedMessages} status={status} />
            {!isPublic ? (
              <ChatScrollAnchor trackVisibility={isLoading} />
            ) : null}
          </>
        ) : (
          <EmptyScreen
            firstPage={firstPage}
            handleInputChange={handleInputChange}
            setInput={setInput}
          />
        )}
      </div>
      <ChatInput
        status={status}
        error={error}
        messages={combinedMessages}
        input={hookInput}
        setInput={setInput}
        submitMessage={submitMessage}
        handleInputChange={handleInputChange}
      />
    </>
  );
}
