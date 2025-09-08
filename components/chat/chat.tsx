"use client";

import { useEffect, useState } from "react";

import { type UIMessage as Message, useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { nanoid } from "nanoid";

import { BasePlan } from "@/lib/swr/use-billing";
import { cn } from "@/lib/utils";

import { ChatInput } from "./chat-input";
import { ChatList } from "./chat-list";
import { ChatScrollAnchor } from "./chat-scroll-anchor";
import { EmptyScreen } from "./empty-screen";

export interface ChatProps extends React.ComponentProps<"div"> {
  initialMessages: Message[];
  threadId?: string;
  firstPage?: string;
  isPublic?: boolean;
  userId?: string;
  plan?: BasePlan | null;
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
    sendMessage,
    error,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/assistants/chat",
      body: {
        threadId: threadId,
        isPublic: isPublic,
        userId: userId,
        plan: plan,
      },
    }),
  });

  const [combinedMessages, setCombinedMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");

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
        parts: [{ type: "text", text: content }],
        id: nanoid(),
      };

      setCombinedMessages((prev) => [...prev, message]);
    }
  }, [error, isPublic, userId, plan]);

  useEffect(() => {
    // Concatenate existing messages with messages from the hook
    // and reverse the order so that the newest messages are at the bottom:
    const reversedMessages = [...initialMessages].reverse();
    setCombinedMessages([...reversedMessages, ...hookMessages]);
  }, [initialMessages, hookMessages]);

  const isLoading = status === "streaming";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      await sendMessage({
        role: "user",
        parts: [{ type: "text", text: input }],
      });
      setInput("");
    }
  };

  return (
    <>
      <div
        className={cn(
          "relative h-[calc(100vh-96px)] overflow-y-auto pb-[20px] pt-24",
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
            handleInputChange={(e) => setInput(e.target.value)}
            setInput={setInput}
          />
        )}
      </div>
      <ChatInput
        status={status}
        error={error}
        messages={combinedMessages}
        input={input}
        setInput={setInput}
        submitMessage={handleSubmit}
        handleInputChange={(e) => setInput(e.target.value)}
      />
    </>
  );
}
