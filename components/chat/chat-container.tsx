"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { MessageCircleDashedIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Card, CardContent } from "@/components/ui/card";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "../conversation";
import { Loader } from "../loader";
import { Message, MessageContent } from "../message";
import { Response } from "../response";
import { Sources, SourcesContent, SourcesTrigger } from "../sources";
import { Separator } from "../ui/separator";
import { ChatLoadingIndicator } from "./chat-loading-indicator";
import { EnhancedChatInput, Scope } from "./enhanced-chat-input";
import { type ScopeItem } from "./scope-pill";

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
  onSessionCreated?: (sessionId: string) => void;
}

export function ChatContainer({
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
  onSessionCreated,
}: EnhancedChatContainerProps) {
  const [error, setError] = useState<string | null>(null);
  const [scopeItems, setScopeItems] = useState<ScopeItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const transportConfig = useMemo(
    () =>
      new DefaultChatTransport({
        api: apiEndpoint,
        headers: { "Content-Type": "application/json" },
        body: { dataroomId, viewerId, linkId, userId, plan, sessionId },
      }),
    [apiEndpoint, dataroomId, viewerId, linkId, userId, plan, sessionId],
  );

  const {
    messages,
    sendMessage,
    status,
    error: chatError,
    stop,
  } = useChat({
    transport: transportConfig,
    onError: (err) => {
      console.error("useChat error:", err);
      setIsProcessing(false); // Stop processing on error
      if (
        err instanceof Error &&
        (err.name === "AbortError" || err.message.includes("aborted"))
      ) {
        console.log("🛑 Request aborted gracefully");
        setError(null);
        return;
      }
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    },
    onFinish: () => {
      console.log("✅ Chat finished successfully");
      setIsProcessing(false);
    },
  });

  // Handle chat errors (filter out aborts)
  useEffect(() => {
    if (chatError) {
      setIsProcessing(false); // Stop processing on error
      if (
        chatError instanceof Error &&
        (chatError.name === "AbortError" ||
          chatError.message.includes("aborted"))
      ) {
        console.log("🛑 Aborted gracefully in chatError effect");
        setError(null);
      } else {
        setError(
          chatError instanceof Error ? chatError.message : "An error occurred",
        );
      }
    }
  }, [chatError]);

  // Drag/drop document scope handler
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
    console.log("🛑 Stop clicked");
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
          metadata: { scope },
        });
      } catch (err) {
        console.error("Error sending message:", err);
        setIsProcessing(false);
        if (
          err instanceof Error &&
          (err.name === "AbortError" || err.message.includes("aborted"))
        ) {
          console.log("🛑 Aborted during send");
          setError(null);
        } else {
          setError("Failed to send message. Please try again.");
        }
      }
    },
    [sendMessage],
  );

  // Update processing state based on status
  useEffect(() => {
    if (status === "streaming" || status === "ready" || status === "error") {
      setIsProcessing(false);
    }
  }, [status]);

  return (
    <div
      className={cn("flex h-full flex-col", className)}
      style={{ maxHeight }}
    >
      {/* Chat Messages */}
      <Card className="max-h-[calc(100vh - 262px)] flex-1 overflow-auto border-none">
        <CardContent className="h-full p-2">
          <Conversation className="h-full">
            <ConversationContent className="space-y-2 p-2">
              {messages.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center text-center text-muted-foreground">
                  <MessageCircleDashedIcon className="mb-2 h-8 w-8" />
                  <p className="text-sm">
                    Start a conversation about your documents
                  </p>
                </div>
              ) : (
                messages.map((message: UIMessage) => (
                  <Message key={message.id} from={message.role}>
                    <MessageContent>
                      {message.parts?.map((part, index) => {
                        if (part.type === "text") {
                          return (
                            <Response key={`${message.id}-${index}`}>
                              {part.text}
                            </Response>
                          );
                        }
                        if (
                          part.type === "source-url" ||
                          part.type === "source-document"
                        ) {
                          return (
                            <Sources key={`${message.id}-source-${index}`}>
                              <SourcesTrigger count={1}>
                                <div className="text-xs text-muted-foreground">
                                  📚 Source: {part.type.replace("source-", "")}
                                </div>
                              </SourcesTrigger>
                              <SourcesContent>
                                <div className="text-sm">
                                  <div className="mb-1 font-medium">
                                    Document Source
                                  </div>
                                  <div className="text-muted-foreground">
                                    {part.type === "source-url" &&
                                      "External URL reference"}
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
                ))
              )}

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
            <ConversationScrollButton />
          </Conversation>
        </CardContent>
      </Card>

      <Separator />

      {/* Chat Input */}
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
}
