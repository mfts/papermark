import { type Message } from "ai";

import { cn } from "@/lib/utils";
import { ChatMessageActions } from "./chat-message-actions";
import UserRound from "../shared/icons/user-round";
import PapermarkSparkle from "../shared/icons/papermark-sparkle";
import AlertCircle from "../shared/icons/alert-circle";

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
        "group relative mb-4 flex items-start md:ml-5 whitespace-pre-wrap",
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
      <div className="flex-1 px-1 ml-4 space-y-2 overflow-hidden">
        <div className="relative flex w-[calc(100%-50px)] flex-col group">
          <div className="font-semibold select-none">
            {mapMessageRole[message.role].name}
          </div>
          <div className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 font-light">
            <p className="mb-2 last:mb-0">{message.content}</p>
          </div>
        </div>
        <ChatMessageActions className="group-hover:flex" message={message} />
      </div>
    </div>
  );
}
