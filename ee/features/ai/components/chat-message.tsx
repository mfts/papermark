"use client";

import { type ComponentPropsWithoutRef, memo, useMemo, useState } from "react";

import {
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FolderIcon,
  ImageIcon,
  PresentationIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";

import type { ChatStreamSource } from "../lib/chat/send-message";

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
  sources?: ChatStreamSource[];
  suggestedQuestions?: string[];
  onSuggestedQuestionClick?: (question: string) => void;
  isLastAssistantMessage?: boolean;
}

type FeedbackState = "up" | "down" | null;

function getViewerBasePath(): string {
  if (typeof window === "undefined") return "";
  const path = window.location.pathname;
  const dIndex = path.indexOf("/d/");
  return dIndex !== -1 ? path.slice(0, dIndex) : path;
}

function buildDocumentUrl(
  dataroomDocumentId: string,
  page?: number,
): string {
  const base = getViewerBasePath();
  const hash = page ? `#page=${page}` : "";
  return `${base}/d/${dataroomDocumentId}${hash}`;
}

function normalizeAssistantLinkHref(href?: string): string | undefined {
  if (!href) {
    return href;
  }

  if (href.startsWith("/")) {
    const dIndex = href.indexOf("/d/");
    if (dIndex !== -1) {
      const docSegment = href.slice(dIndex);
      return `${getViewerBasePath()}${docSegment}`;
    }
    return href;
  }

  try {
    const parsed = new URL(href);
    const dIndex = parsed.pathname.indexOf("/d/");
    if (dIndex !== -1) {
      const docSegment = parsed.pathname.slice(dIndex);
      return `${getViewerBasePath()}${docSegment}${parsed.search}${parsed.hash}`;
    }
  } catch {
    // Keep original href if URL parsing fails.
  }

  return href;
}

function AssistantLink({
  children,
  className,
  href,
  ...props
}: ComponentPropsWithoutRef<"a">) {
  const normalizedHref = normalizeAssistantLinkHref(href);

  return (
    <a
      {...props}
      className={cn("inline-flex items-center", className)}
      href={normalizedHref}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

// ============================================================================
// File type icon helper
// ============================================================================

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return <FileTextIcon className="size-3.5 text-red-500" />;
    case "ppt":
    case "pptx":
      return <PresentationIcon className="size-3.5 text-orange-500" />;
    case "xls":
    case "xlsx":
    case "csv":
      return <FileSpreadsheetIcon className="size-3.5 text-green-600" />;
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
      return <ImageIcon className="size-3.5 text-purple-500" />;
    default:
      return <FileIcon className="size-3.5 text-blue-500" />;
  }
}

// ============================================================================
// Sources Section
// ============================================================================

function SourcesSection({ sources }: { sources: ChatStreamSource[] }) {
  const [expanded, setExpanded] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="!mt-3 rounded-lg border border-gray-200 bg-gray-50/50">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100/50"
      >
        <span>
          Source: {sources.length}{" "}
          {sources.length === 1 ? "document" : "documents"}
        </span>
        <ChevronDownIcon
          className={cn(
            "size-3.5 text-gray-400 transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <div className="border-t border-gray-200 px-3 py-2">
          <div className="space-y-1.5">
            {sources.map((source) => (
              <a
                key={`${source.id}-${source.page}`}
                href={
                  source.dataroomDocumentId
                    ? buildDocumentUrl(source.dataroomDocumentId, source.page)
                    : normalizeAssistantLinkHref(source.url)
                }
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-gray-100"
              >
                <span className="mt-0.5 shrink-0 text-[10px] font-semibold text-gray-400">
                  {source.id}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {getFileIcon(source.name)}
                    <span className="truncate text-xs font-medium text-gray-900 group-hover:text-primary">
                      {source.name}
                    </span>
                    {source.page && (
                      <span className="shrink-0 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                        Page {source.page}
                      </span>
                    )}
                  </div>
                  {source.folderPath && (
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-400">
                      <FolderIcon className="size-2.5" />
                      <span className="truncate">{source.folderPath}</span>
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Suggested Questions
// ============================================================================

function SuggestedQuestions({
  questions,
  onQuestionClick,
}: {
  questions: string[];
  onQuestionClick?: (question: string) => void;
}) {
  if (questions.length === 0) return null;

  return (
    <div className="!mt-5">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">
        Suggested questions
      </p>
      <div className="space-y-1">
        {questions.map((question, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onQuestionClick?.(question)}
            className="block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-gray-900"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

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
  sources,
  suggestedQuestions,
  onSuggestedQuestionClick,
  isLastAssistantMessage,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const isUser = role === "user";
  const responseComponents = useMemo(
    () => ({
      a: AssistantLink,
    }),
    [],
  );

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
    const newFeedback = feedback === type ? null : type;
    setFeedback(newFeedback);

    if (messageId && onFeedback && newFeedback) {
      onFeedback(messageId, newFeedback);
    }
  };

  if (isUser) {
    return (
      <Message from="user" className={className}>
        <MessageContent>
          <p className="whitespace-pre-wrap">{content}</p>
        </MessageContent>
      </Message>
    );
  }

  return (
    <div className="space-y-1">
      <Message from="assistant" className={className}>
        <MessageContent>
          {isStreaming && !content ? (
            <Shimmer duration={1.5}>Generating response...</Shimmer>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <MessageResponse
                components={responseComponents}
                linkSafety={{ enabled: false }}
              >
                {content}
              </MessageResponse>
            </div>
          )}
        </MessageContent>
      </Message>

      {content && !isStreaming && (
        <>
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
          </MessageActions>

          {sources && sources.length > 0 && (
            <SourcesSection sources={sources} />
          )}

          {isLastAssistantMessage &&
            suggestedQuestions &&
            suggestedQuestions.length > 0 && (
              <SuggestedQuestions
                questions={suggestedQuestions}
                onQuestionClick={onSuggestedQuestionClick}
              />
            )}
        </>
      )}
    </div>
  );
});

export default ChatMessage;
