"use client";

import { type UIMessage } from "@ai-sdk/react";

import { cn } from "@/lib/utils";
import { useCopyToClipboard } from "@/lib/utils/use-copy-to-clipboard";

import { Button } from "@/components/ui/button";

import Check from "../shared/icons/check";
import Copy from "../shared/icons/copy";

interface ChatMessageActionsProps extends React.ComponentProps<"div"> {
  message: UIMessage;
}

export function ChatMessageActions({
  message,
  className,
  ...props
}: ChatMessageActionsProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const onCopy = () => {
    if (isCopied) return;
    const textContent =
      message.parts
        ?.filter((part) => part.type === "text")
        .map((part) => part.text)
        .join(" ") || "";
    copyToClipboard(textContent);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-end md:absolute md:-top-2 md:right-0 md:hidden",
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