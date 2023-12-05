"use client";

import { type Message } from "ai";

import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/lib/utils/use-copy-to-clipboard";
import { cn } from "@/lib/utils";
import Check from "../shared/icons/check";
import Copy from "../shared/icons/copy";

interface ChatMessageActionsProps extends React.ComponentProps<"div"> {
  message: Message;
}

export function ChatMessageActions({
  message,
  className,
  ...props
}: ChatMessageActionsProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const onCopy = () => {
    if (isCopied) return;
    copyToClipboard(message.content);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-end md:hidden md:absolute md:right-0 md:-top-2",
        className,
      )}
      {...props}
    >
      <Button variant="ghost" size="icon" onClick={onCopy}>
        {isCopied ? <Check /> : <Copy />}
        <span className="sr-only">Copy message</span>
      </Button>
    </div>
  );
}
