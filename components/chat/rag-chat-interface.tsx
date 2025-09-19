"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MessageCircleDashedIcon, PlusIcon } from "lucide-react";

import {
  type ChatSession,
  useChatSessionsInfinite,
} from "@/lib/swr/use-chat-sessions";
import { timeAgo } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { Loader } from "../loader";
import { ChatContainer } from "./chat-container";

interface RAGChatProps {
  dataroomId: string;
  viewerId: string;
  linkId: string;
  documents?: Array<{
    id: string;
    name: string;
    folderId: string | null;
  }>;
  folders?: Array<{
    id: string;
    name: string;
    parentId: string | null;
  }>;
  viewMode?: "chat" | "history";
  onViewModeChange?: (mode: "chat" | "history") => void;
  currentSessionId?: string | null;
  onSessionChange?: (sessionId: string | null) => void;
}

type ViewMode = "chat" | "history";

export function RAGChatInterface({
  dataroomId,
  viewerId,
  linkId,
  documents = [],
  folders = [],
  viewMode: externalViewMode,
  onViewModeChange,
  currentSessionId,
  onSessionChange,
}: RAGChatProps) {
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>("chat");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    currentSessionId || null,
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isRequestingMoreRef = useRef(false);
  const viewMode = externalViewMode || internalViewMode;
  const {
    sessions: chatHistory,
    isLoading: sessionsLoading,
    isLoadingMore,
    isReachingEnd,
    hasNextPage,
    loadMore,
    mutate: mutateSessions,
  } = useChatSessionsInfinite({
    dataroomId,
    viewerId,
    linkId,
    enabled: viewMode === "history",
    limit: 20,
  });
  const setViewMode = useCallback(
    (mode: ViewMode) => {
      if (onViewModeChange) {
        onViewModeChange(mode);
      } else {
        setInternalViewMode(mode);
      }
    },
    [onViewModeChange],
  );

  const refreshChatHistory = useCallback(() => {
    mutateSessions();
  }, [mutateSessions]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;

    if (
      !container ||
      isLoadingMore ||
      isReachingEnd ||
      !hasNextPage ||
      isRequestingMoreRef.current
    ) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    const threshold = 0.75;

    if (scrollPercentage >= threshold) {
      isRequestingMoreRef.current = true;
      loadMore();
    }
  }, [isLoadingMore, isReachingEnd, hasNextPage, loadMore]);

  useEffect(() => {
    if (!isLoadingMore) {
      isRequestingMoreRef.current = false;
    }
  }, [isLoadingMore]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  useEffect(() => {
    if (!externalViewMode) {
      setViewMode("chat");
    }
  }, [externalViewMode, setViewMode]);

  const handleNewChat = () => {
    if (viewMode !== "chat" || selectedSessionId !== null) {
      setViewMode("chat");
      setSelectedSessionId(null);
      onSessionChange?.(null);
    }
  };

  const handleChatHistorySelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setViewMode("chat");
    onSessionChange?.(sessionId);
  };

  if (sessionsLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="mb-2 h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (viewMode === "history") {
    return (
      <div className="flex h-full flex-col">
        {/* Chat History List */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          {chatHistory.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
              <MessageCircleDashedIcon className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium">No chat history yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                You haven&apos;t started any conversations yet
              </p>
              <Button onClick={handleNewChat}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Start New Chat
              </Button>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {chatHistory.map((chat: ChatSession) => (
                <Card
                  key={chat.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => handleChatHistorySelect(chat.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="truncate text-sm font-medium">
                        {chat.title}
                      </CardTitle>
                      <div className="flex items-center">
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {timeAgo(new Date(chat.updatedAt))}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  {chat.lastMessage && (
                    <CardContent className="pt-0">
                      <div className="line-clamp-1 text-sm text-muted-foreground">
                        {chat.lastMessage.content}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}

              {isLoadingMore && (
                <div className="flex justify-center p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader />
                    Loading more chats...
                  </div>
                </div>
              )}

              {isReachingEnd &&
                chatHistory.length >= 20 &&
                hasNextPage === false && (
                  <div className="flex justify-center p-4">
                    <div className="text-sm text-muted-foreground">
                      You&apos;ve reached the end of your chat history
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const selectedSession = selectedSessionId
    ? chatHistory.find((s) => s.id === selectedSessionId)
    : undefined;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <ChatContainer
          dataroomId={dataroomId}
          viewerId={viewerId}
          linkId={linkId}
          apiEndpoint="/api/rag/chat"
          placeholder="Ask about your documents..."
          maxHeight="100vh"
          className="h-full"
          documents={documents}
          folders={folders}
          sessionId={selectedSessionId}
          sessionData={selectedSession}
        />
      </div>
    </div>
  );
}
