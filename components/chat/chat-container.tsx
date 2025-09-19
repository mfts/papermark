"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { useChatContext } from "@/context/chat-context";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { MessageCircleDashedIcon } from "lucide-react";

import { useSessionMessagesInfinite } from "@/lib/swr/use-session-messages";
import { cn, getFormattedDate, isSameChatDay } from "@/lib/utils";

import { Card, CardContent } from "@/components/ui/card";

import { Conversation, ConversationContent } from "../conversation";
import { Loader } from "../loader";
import { Message, MessageContent } from "../message";
import { Response } from "../response";
import { Sources, SourcesContent, SourcesTrigger } from "../sources";
import { DateSeparator } from "../ui/date-separator";
import LoadingSpinner from "../ui/loading-spinner";
import { Separator } from "../ui/separator";
import { ChatLoadingIndicator } from "./chat-loading-indicator";
import { EnhancedChatInput, Scope } from "./enhanced-chat-input";
import { type ScopeItem } from "./scope-pill";

const isAbortError = (error: unknown): boolean => {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.message.includes("aborted"))
  );
};

const handleAbortError = (
  error: unknown,
  setError: (error: string | null) => void,
): void => {
  if (isAbortError(error)) {
    setError(null);
  } else {
    setError(
      error instanceof Error ? error.message : "An unexpected error occurred",
    );
  }
};

const MessageComponent = ({ message }: { message: UIMessage }) => {
  const messageKey = `${message.id}-${message.parts?.length || 0}`;

  return (
    <Message key={messageKey} from={message.role}>
      <MessageContent>
        {message.parts?.map((part, index) => {
          if (part.type === "text") {
            return (
              <Response key={`${message.id}-${index}`}>{part.text}</Response>
            );
          }
          if (part.type === "source-url" || part.type === "source-document") {
            return (
              <Sources key={`${message.id}-source-${index}`}>
                <SourcesTrigger count={1}>
                  <div className="text-xs text-muted-foreground">
                    📚 Source: {part.type.replace("source-", "")}
                  </div>
                </SourcesTrigger>
                <SourcesContent>
                  <div className="text-sm">
                    <div className="mb-1 font-medium">Document Source</div>
                    <div className="text-muted-foreground">
                      {part.type === "source-url" && "External URL reference"}
                      {part.type === "source-document" &&
                        "Internal document reference"}
                    </div>
                  </div>
                </SourcesContent>
              </Sources>
            );
          }

          return null;
        }) || (
          <div className="whitespace-pre-wrap leading-relaxed">
            No content available
          </div>
        )}
      </MessageContent>
    </Message>
  );
};

export interface EnhancedChatContainerProps {
  dataroomId?: string;
  viewerId?: string;
  linkId?: string;
  apiEndpoint?: string;
  placeholder?: string;
  userId?: string;
  plan?: string;
  className?: string;
  maxHeight?: string;
  documents?: Array<{ id: string; name: string; folderId: string | null }>;
  folders?: Array<{ id: string; name: string; parentId: string | null }>;
  sessionId?: string | null;
  sessionData?: {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export const ChatContainer = memo(function ChatContainer({
  dataroomId,
  viewerId,
  linkId,
  apiEndpoint = "/api/rag/chat",
  placeholder = "Ask about your documents...",
  userId,
  plan,
  className,
  maxHeight = "600px",
  documents = [],
  folders = [],
  sessionId,
  sessionData,
}: EnhancedChatContainerProps) {
  const [error, setError] = useState<string | null>(null);
  const [scopeItems, setScopeItems] = useState<ScopeItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { setCurrentSession } = useChatContext();
  const {
    messages: existingMessages,
    isLoading: isLoadingMessages,
    loadMore,
    hasNextPage,
    isLoadingMore,
  } = useSessionMessagesInfinite({
    sessionId: sessionId || null,
    dataroomId: dataroomId || "",
    viewerId: viewerId || "",
    linkId: linkId || "",
    enabled: !!sessionId,
    limit: 20,
  });

  useEffect(() => {
    if (sessionId && sessionData) {
      setCurrentSession(sessionData);
    } else if (!sessionId) {
      setCurrentSession(null);
    }
  }, [sessionId, sessionData, setCurrentSession]);

  const transportConfig = useMemo(
    () =>
      new DefaultChatTransport({
        api: apiEndpoint,
        headers: { "Content-Type": "application/json" },
        body: { dataroomId, viewerId, linkId, userId, plan },
      }),
    [apiEndpoint, dataroomId, viewerId, linkId, userId, plan],
  );

  const {
    messages: newMessages,
    sendMessage,
    status,
    error: chatError,
    stop,
  } = useChat({
    transport: transportConfig,
    onError: (err) => {
      console.error("useChat error:", err);
      setIsProcessing(false);
      handleAbortError(err, setError);
    },
    onFinish: () => {
      setIsProcessing(false);
    },
  });

  const allMessages = useMemo(() => {
    const existingUIMessages: UIMessage[] = existingMessages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: new Date(msg.createdAt),
      parts: [{ type: "text", text: msg.content }],
    }));

    return [...existingUIMessages, ...newMessages];
  }, [existingMessages, newMessages]);

  const messageList = useMemo(() => {
    if (allMessages.length === 0) return [];

    const messagesWithTimeIndicators: React.ReactNode[] = [];

    allMessages.forEach((message, index) => {
      const messageDate = (message as any).createdAt || new Date();
      const prevMessageDate =
        index > 0
          ? (allMessages[index - 1] as any).createdAt || new Date()
          : null;
      const showDateSeparator =
        index > 0 &&
        prevMessageDate &&
        !isSameChatDay(messageDate, prevMessageDate);

      if (showDateSeparator) {
        messagesWithTimeIndicators.push(
          <DateSeparator
            key={`date-${message.id}`}
            date={getFormattedDate(messageDate)}
          />,
        );
      }

      messagesWithTimeIndicators.push(
        <MessageComponent
          key={`${message.id}-${message.parts?.length || 0}`}
          message={message}
        />,
      );
    });

    return messagesWithTimeIndicators;
  }, [allMessages]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop } = e.currentTarget;
      if (scrollTop <= 800 && hasNextPage && !isLoadingMore) {
        requestAnimationFrame(() => {
          loadMore();
        });
      }
    },
    [hasNextPage, isLoadingMore, loadMore],
  );

  const paginationLoadingIndicator = isLoadingMore ? (
    <div className="flex justify-center">
      <div className="flex items-center rounded-full border border-border/60 bg-background p-2 shadow-lg backdrop-blur-sm">
        <Loader />
      </div>
    </div>
  ) : null;

  const handleDocumentDrop = useCallback((event: CustomEvent) => {
    const { id, type, name } = event.detail;
    const newScopeItem: ScopeItem = { id, type, name };

    setScopeItems((prev) => {
      if (!prev.some((item) => item.id === newScopeItem.id)) {
        return [...prev, newScopeItem];
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    window.addEventListener(
      "document-drop",
      handleDocumentDrop as EventListener,
    );
    return () => {
      window.removeEventListener(
        "document-drop",
        handleDocumentDrop as EventListener,
      );
    };
  }, [handleDocumentDrop]);

  const handleStop = useCallback(() => {
    setIsProcessing(false);
    setError(null);
    stop();
  }, [stop]);

  const handleSubmit = useCallback(
    async (input: string, scope?: Scope) => {
      try {
        setError(null);
        setIsProcessing(true);
        await sendMessage({
          role: "user",
          parts: [{ type: "text", text: input }],
          metadata: { scope, sessionId },
        });
      } catch (err) {
        console.error("Error sending message:", err);
        setIsProcessing(false);
        handleAbortError(err, setError);
      }
    },
    [sendMessage, sessionId],
  );

  return (
    <div
      className={cn("flex h-full flex-col", className)}
      style={{ maxHeight }}
    >
      <Card className="max-h-[calc(100vh - 262px)] flex-1 overflow-auto border-none">
        <CardContent className="h-full p-2">
          {isLoadingMessages && allMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <LoadingSpinner />
              <p className="text-sm">Loading conversation...</p>
            </div>
          ) : allMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <MessageCircleDashedIcon className="mb-2 h-8 w-8" />
              <p className="text-sm">
                Start a conversation about your documents
              </p>
            </div>
          ) : (
            <Conversation className="h-full" onScroll={handleScroll}>
              <ConversationContent className="space-y-4">
                {paginationLoadingIndicator}

                {messageList}

                {isProcessing && (
                  <Message from="assistant">
                    <MessageContent className="overflow-visible">
                      <ChatLoadingIndicator isVisible={true} />
                    </MessageContent>
                  </Message>
                )}
                {status === "streaming" && (
                  <Message from="assistant">
                    <MessageContent>
                      <Loader />
                    </MessageContent>
                  </Message>
                )}
              </ConversationContent>
            </Conversation>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-none">
        <CardContent className="p-1">
          <EnhancedChatInput
            onSubmit={handleSubmit}
            onStop={handleStop}
            placeholder={placeholder}
            disabled={isProcessing || status === "streaming"}
            isLoading={isProcessing || status === "streaming"}
            scopeItems={scopeItems}
            onScopeItemsChange={setScopeItems}
            documents={documents}
            folders={folders}
          />
        </CardContent>
      </Card>
    </div>
  );
});

ChatContainer.displayName = "ChatContainer";
