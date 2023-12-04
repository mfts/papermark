import { type Message } from "ai";

import { Separator } from "@/components/ui/separator";
import { ChatMessage } from "./chat-message";
import Skeleton from "../Skeleton";
import PapermarkSparkle from "../shared/icons/papermark-sparkle";

export interface ChatList {
  messages: Message[];
  status: "in_progress" | "awaiting_message";
}

export function ChatList({ messages, status }: ChatList) {
  if (!messages.length) {
    return null;
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4">
      {messages.map((message, index) => (
        <div key={index}>
          <ChatMessage message={message} />
          {index < messages.length - 1 && (
            <Separator className="my-4 bg-background" />
          )}
        </div>
      ))}
      {status === "in_progress" && (
        <>
          <Separator className="my-4 bg-background" />
          <div
            key={"loading-message"}
            className="group relative mb-4 flex items-start ml-5 whitespace-pre-wrap"
          >
            <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow bg-primary text-primary-foreground">
              <PapermarkSparkle />
            </div>
            <div className="flex-1 px-1 ml-4 space-y-2 overflow-hidden">
              <div className="font-semibold select-none">
                Papermark Assistant
              </div>
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
