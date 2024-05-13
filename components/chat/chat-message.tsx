import { type Message } from "ai";

import { cn } from "@/lib/utils";

import AlertCircle from "../shared/icons/alert-circle";
import PapermarkSparkle from "../shared/icons/papermark-sparkle";
import UserRound from "../shared/icons/user-round";
import { ChatMessageActions } from "./chat-message-actions";

// map role to icon and name
const mapMessageRole = {
  user: { icon: <UserRound />, name: "You" },
  system: { icon: <AlertCircle />, name: "System" },
  assistant: { icon: <PapermarkSparkle />, name: "Papermark Assistant" },
  function: { icon: <PapermarkSparkle />, name: "Papermark Assistant" },
  data: { icon: <PapermarkSparkle />, name: "Papermark Assistant" },
  tool: { icon: <PapermarkSparkle />, name: "Papermark Assistant" },
};

export interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message, ...props }: ChatMessageProps) {
  return (
    <div
      key={message.id}
      className={cn(
        "group relative mb-4 flex items-start whitespace-pre-wrap md:ml-5",
      )}
      {...props}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow",
          message.role === "user"
            ? "bg-background"
            : message.role === "system"
              ? "bg-destructive text-destructive-foreground"
              : "bg-primary text-primary-foreground",
        )}
      >
        {mapMessageRole[message.role].icon}
      </div>
      <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
        <div className="group relative flex w-[calc(100%-50px)] flex-col">
          <div className="select-none font-semibold">
            {mapMessageRole[message.role].name}
          </div>
          <div className="prose break-words font-light dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
            <p className="mb-2 last:mb-0">{message.content}</p>
          </div>
        </div>
        <ChatMessageActions className="group-hover:flex" message={message} />
      </div>
    </div>
  );
}
