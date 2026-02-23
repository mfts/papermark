"use client";

import { useCallback, useRef, useState } from "react";

import {
  AtSignIcon,
  FileTextIcon,
  Loader2,
  Plus,
  PlusIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { parseTextStream } from "../lib/stream/parse-text-stream";
import ChatMessage from "./chat-message";
import {
  DocumentContextSelector,
  SelectedContextItem,
  SelectedContextItems,
  getDocumentsInFolder,
} from "./document-context-selector";
import { useViewerChatSafe } from "./viewer-chat-provider";
import { ViewerThreadSelector } from "./viewer-thread-selector";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface ViewerChatPanelProps {
  className?: string;
}

/**
 * Standalone chat panel that reads configuration from ViewerChatProvider.
 * Place this anywhere in the component tree within ViewerChatProvider.
 * It will render as a fixed panel on the right side when open.
 */
export function ViewerChatPanel({ className }: ViewerChatPanelProps) {
  const context = useViewerChatSafe();

  // Don't render if not in provider or not enabled
  if (!context || !context.isEnabled) {
    return null;
  }

  // Don't render if closed
  if (!context.isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 top-16 z-30 w-[400px] shadow-xl">
      <ViewerChatPanelContent
        onClose={context.close}
        dataroomId={context.config.dataroomId}
        dataroomName={context.config.dataroomName}
        documentId={context.config.documentId}
        documentName={context.config.documentName}
        linkId={context.config.linkId}
        viewId={context.config.viewId}
        viewerId={context.config.viewerId}
        documents={context.documents}
        folders={context.folders}
      />
    </div>
  );
}

// ============================================================================
// Internal Content Component
// ============================================================================

interface ViewerChatPanelContentProps {
  onClose: () => void;
  dataroomId?: string;
  dataroomName?: string;
  documentId?: string;
  documentName?: string;
  linkId?: string;
  viewId?: string;
  viewerId?: string;
  documents?: Array<{
    dataroomDocumentId: string;
    id: string;
    name: string;
    folderId: string | null;
  }>;
  folders?: Array<{
    id: string;
    name: string;
    parentId: string | null;
    path: string;
    orderIndex: number | null;
    dataroomId: string;
    createdAt: Date;
    updatedAt: Date;
    hierarchicalIndex: string | null;
    icon: string | null;
    color: string | null;
  }>;
}

function ViewerChatPanelContent({
  onClose,
  dataroomId,
  dataroomName,
  documentId,
  documentName,
  linkId,
  viewId,
  viewerId,
  documents = [],
  folders = [],
}: ViewerChatPanelContentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState<string | undefined>();
  const [selectedContextItems, setSelectedContextItems] = useState<
    SelectedContextItem[]
  >([]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const contextName = dataroomName || documentName || "Document";

  // Handle abort/stop
  const handleAbort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    // Mark any streaming message as complete
    setMessages((prev) =>
      prev.map((m) =>
        m.isStreaming
          ? {
              ...m,
              isStreaming: false,
              content: m.content || "Message cancelled.",
            }
          : m,
      ),
    );
  }, []);

  // Calculate selected document IDs from context items (expanding folders)
  const getSelectedDocumentIds = useCallback((): string[] => {
    if (selectedContextItems.length === 0) return [];

    const docIds = new Set<string>();

    for (const item of selectedContextItems) {
      if (item.type === "document") {
        docIds.add(item.id);
      } else {
        // For folders, get all documents in the folder
        const docsInFolder = getDocumentsInFolder(item.id, documents, folders);
        docsInFolder.forEach((doc) => docIds.add(doc.dataroomDocumentId));
      }
    }

    return Array.from(docIds);
  }, [selectedContextItems, documents, folders]);

  // Handle removing a context item
  const handleRemoveContextItem = useCallback(
    (type: "document" | "folder", id: string) => {
      setSelectedContextItems((prev) =>
        prev.filter((item) => !(item.type === type && item.id === id)),
      );
    },
    [],
  );

  // Create chat session
  const createChat = async () => {
    try {
      const response = await fetch(`/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          dataroomId,
          linkId,
          viewId,
          viewerId,
        }),
      });

      if (!response.ok) throw new Error("Failed to create chat");

      const data = await response.json();
      setChatId(data.id);
      setChatTitle(undefined);
      return data.id;
    } catch (error) {
      console.error("Error creating chat:", error);
      return null;
    }
  };

  // Load existing chat
  const loadChat = useCallback(
    async (selectedChatId: string) => {
      try {
        setIsLoading(true);
        const queryParams = viewerId ? `?viewerId=${viewerId}` : "";

        const response = await fetch(
          `/api/ai/chat/${selectedChatId}${queryParams}`,
        );

        if (!response.ok) throw new Error("Failed to load chat");

        const data = await response.json();
        setChatId(selectedChatId);
        setChatTitle(data.title);

        // Convert messages to the format expected by the UI
        const loadedMessages: Message[] = data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
        }));

        setMessages(loadedMessages);
      } catch (error) {
        console.error("Error loading chat:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [viewerId],
  );

  // Start new chat
  const handleNewChat = useCallback(() => {
    setChatId(null);
    setChatTitle(undefined);
    setMessages([]);
  }, []);

  // Delete chat
  const handleDeleteChat = useCallback(
    async (deleteChatId: string) => {
      try {
        const queryParams = viewerId ? `?viewerId=${viewerId}` : "";
        await fetch(`/api/ai/chat/${deleteChatId}${queryParams}`, {
          method: "DELETE",
        });

        // If deleted current chat, start new one
        if (deleteChatId === chatId) {
          handleNewChat();
        }
      } catch (error) {
        console.error("Error deleting chat:", error);
      }
    },
    [chatId, viewerId, handleNewChat],
  );

  const handleSubmit = async (message: PromptInputMessage) => {
    if (!message.text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message.text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Create chat if needed
      let currentChatId = chatId;
      if (!currentChatId) {
        currentChatId = await createChat();
        if (!currentChatId) {
          setIsLoading(false);
          return;
        }
      }

      const queryParams = viewerId ? `?viewerId=${viewerId}` : "";

      // Get selected document IDs for filtering
      const filterDataroomDocumentIds = getSelectedDocumentIds();

      const response = await fetch(
        `/api/ai/chat/${currentChatId}/messages${queryParams}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: userMessage.content,
            // When viewing a specific document in a dataroom, filter search to that document
            filterDocumentId: documentId,
            // User-selected context filter (only if items are selected)
            ...(filterDataroomDocumentIds.length > 0 && {
              filterDataroomDocumentIds,
            }),
          }),
          signal: abortControllerRef.current.signal,
        },
      );

      if (!response.ok) throw new Error("Failed to send message");

      // Get the reader for streaming
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      // Create placeholder for assistant message
      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Parse the text stream
      await parseTextStream(reader, {
        onTextDelta: (_delta, accumulated) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId ? { ...m, content: accumulated } : m,
            ),
          );
        },
        onTextEnd: (content) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content, isStreaming: false }
                : m,
            ),
          );
        },
        onError: (error) => {
          console.error("Stream error:", error);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    content:
                      "Sorry, there was an error processing your request.",
                    isStreaming: false,
                  }
                : m,
            ),
          );
        },
      });
    } catch (error) {
      // Don't show error if aborted
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, there was an error sending your message.",
        },
      ]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="flex h-full w-full flex-col border-l border-gray-200 bg-white">
      {/* Header with Thread Selector and New Chat Button */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <ViewerThreadSelector
            currentChatId={chatId}
            currentChatTitle={chatTitle}
            onSelectChat={loadChat}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
            documentId={documentId}
            dataroomId={dataroomId}
            linkId={linkId}
            viewerId={viewerId}
            viewId={viewId}
          />
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewChat}
                  className="size-8 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                >
                  <Plus className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Chat</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="size-8 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Context Name */}
      <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-1.5">
        <p className="truncate text-xs text-gray-500">{contextName}</p>
      </div>

      {/* Messages */}
      <Conversation className="flex-1">
        <ConversationContent className="gap-4 p-4">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <SparklesIcon className="size-6 text-primary" />
                </div>
              }
              title="Ask me anything"
              description={`I can help you understand and analyze the content of this ${dataroomId ? "data room" : "document"}.`}
            />
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <ChatMessage
                    role={message.role}
                    content={message.content}
                    isStreaming={message.isStreaming}
                  />
                </div>
              ))}

              {/* Show loading indicator while waiting for response */}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input */}
      <div className="relative border-t border-gray-200 p-3">
        {/* Document Context Selector (@ mention popover) */}
        {dataroomId && documents.length > 0 && (
          <DocumentContextSelector
            documents={documents}
            folders={folders}
            selectedItems={selectedContextItems}
            onSelectionChange={setSelectedContextItems}
            open={selectorOpen}
            onOpenChange={setSelectorOpen}
          />
        )}

        <PromptInput onSubmit={handleSubmit}>
          {/* Show focused document or selected context items */}
          {(documentId && documentName) || selectedContextItems.length > 0 ? (
            <PromptInputHeader>
              {documentId && documentName ? (
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <div className="relative flex h-8 select-none items-center gap-1.5 rounded-md border border-border bg-muted/50 px-1.5 text-sm font-medium text-muted-foreground transition-all dark:hover:bg-accent/50">
                        <div className="relative size-5 shrink-0">
                          <div className="absolute inset-0 flex size-5 items-center justify-center overflow-hidden rounded bg-background">
                            <FileTextIcon className="size-4 text-muted-foreground" />
                          </div>
                        </div>
                        <span className="max-w-[150px] flex-1 truncate">
                          {documentName}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[300px]">
                      <p className="break-all">{documentName}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <SelectedContextItems
                  items={selectedContextItems}
                  onRemove={handleRemoveContextItem}
                />
              )}
            </PromptInputHeader>
          ) : null}
          <PromptInputTextarea
            placeholder={
              dataroomId && documents.length > 0
                ? "Ask a question... (click + to add context)"
                : "Ask a question..."
            }
            disabled={isLoading}
            className="min-h-12"
          />
          <PromptInputFooter className="pt-2">
            {/* @ button to open document selector */}
            {dataroomId && documents.length > 0 && (
              <PromptInputTools>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PromptInputButton
                        onClick={() => setSelectorOpen(true)}
                        disabled={isLoading}
                      >
                        <PlusIcon className="size-4" />
                      </PromptInputButton>
                    </TooltipTrigger>
                    <TooltipContent>Add document context</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </PromptInputTools>
            )}
            <div className="flex-1" />
            {isLoading ? (
              <PromptInputSubmit onClick={handleAbort} status="streaming" />
            ) : (
              <PromptInputSubmit status="ready" />
            )}
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
