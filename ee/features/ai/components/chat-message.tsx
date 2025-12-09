"use client";

import { memo, useState } from "react";

import {
  CheckIcon,
  CopyIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";

// ============================================================================
// Types
// ============================================================================

export interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  className?: string;
  messageId?: string;
  onFeedback?: (messageId: string, feedback: "up" | "down") => void;
}

type FeedbackState = "up" | "down" | null;

// ============================================================================
// Main Component
// ============================================================================

export const ChatMessage = memo(function ChatMessage({
  role,
  content,
  isStreaming = false,
  className,
  messageId,
  onFeedback,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const isUser = role === "user";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleFeedback = (type: "up" | "down") => {
    // Toggle feedback if clicking the same button, otherwise set new feedback
    const newFeedback = feedback === type ? null : type;
    setFeedback(newFeedback);

    if (messageId && onFeedback && newFeedback) {
      onFeedback(messageId, newFeedback);
    }
  };

  // For user messages, simple rendering
  if (isUser) {
    return (
      <Message from="user" className={className}>
        <MessageContent>
          <p className="whitespace-pre-wrap">{content}</p>
        </MessageContent>
      </Message>
    );
  }

  // For assistant messages
  return (
    <div className="space-y-1">
      <Message from="assistant" className={className}>
        <MessageContent>
          {isStreaming && !content ? (
            <Shimmer duration={1.5}>Generating response...</Shimmer>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <MessageResponse>{content}</MessageResponse>
            </div>
          )}
        </MessageContent>
      </Message>

      {/* Message actions - always visible when there's content and not streaming */}
      {content && !isStreaming && (
        <MessageActions className="ml-0">
          <MessageAction
            onClick={handleCopy}
            tooltip={copied ? "Copied!" : "Copy"}
            label={copied ? "Copied" : "Copy message"}
            variant="ghost"
            size="icon"
            className="size-7"
          >
            {copied ? (
              <CheckIcon className="size-3.5 text-green-500" />
            ) : (
              <CopyIcon className="size-3.5 text-muted-foreground" />
            )}
          </MessageAction>
          {/* <MessageAction
            onClick={() => handleFeedback("up")}
            tooltip="Good response"
            label="Good response"
            variant="ghost"
            size="icon"
            className="size-7"
          >
            <ThumbsUpIcon
              className={`size-3.5 ${
                feedback === "up"
                  ? "fill-green-500 text-green-500"
                  : "text-muted-foreground"
              }`}
            />
          </MessageAction>
          <MessageAction
            onClick={() => handleFeedback("down")}
            tooltip="Bad response"
            label="Bad response"
            variant="ghost"
            size="icon"
            className="size-7"
          >
            <ThumbsDownIcon
              className={`size-3.5 ${
                feedback === "down"
                  ? "fill-red-500 text-red-500"
                  : "text-muted-foreground"
              }`}
            />
          </MessageAction> */}
        </MessageActions>
      )}
    </div>
  );
});

export default ChatMessage;
