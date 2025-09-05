"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ArrowUpIcon, Loader2Icon, Square } from "lucide-react";

import { cn } from "@/lib/utils";

import { Textarea } from "@/components/ui/textarea";

import { DroppableChatInput } from "./droppable-chat-input";
import { FileSelectorPopover } from "./file-selector-popover";
import { type ScopeItem } from "./scope-pill";
import { ScopePillsContainer } from "./scope-pills-container";

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY),
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight],
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

export interface Scope {
  docs: string[];
  folders: string[];
  folderDocs: string[];
}

const MIN_HEIGHT = 48;
const MAX_HEIGHT = 164;

interface EnhancedChatInputProps {
  onSubmit: (input: string, scope?: Scope) => Promise<void>;
  onStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  scopeItems?: ScopeItem[];
  onScopeItemsChange?: (items: ScopeItem[]) => void;
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
}

export function EnhancedChatInput({
  onSubmit,
  onStop,
  placeholder = "Ask about your documents...",
  disabled = false,
  isLoading = false,
  className,
  scopeItems = [],
  onScopeItemsChange,
  documents = [],
  folders = [],
}: EnhancedChatInputProps) {
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localScopeItems, setLocalScopeItems] =
    useState<ScopeItem[]>(scopeItems);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);

  const selectedFolderIds = useMemo(
    () =>
      localScopeItems
        .filter((item) => item.type === "folder")
        .map((item) => item.id),
    [localScopeItems],
  );

  const folderChildrenMap = useMemo(() => {
    const map = new Map<string, string[]>();
    folders.forEach((folder) => {
      if (folder.parentId) {
        if (!map.has(folder.parentId)) {
          map.set(folder.parentId, []);
        }
        map.get(folder.parentId)!.push(folder.id);
      }
    });
    return map;
  }, [folders]);

  const getAllNestedFolderIds = useCallback(
    (folderIds: string[]): string[] => {
      const allFolderIds = new Set<string>(folderIds);
      const queue = [...folderIds];

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const children = folderChildrenMap.get(currentId) || [];
        for (const childId of children) {
          if (!allFolderIds.has(childId)) {
            allFolderIds.add(childId);
            queue.push(childId);
          }
        }
      }

      return Array.from(allFolderIds);
    },
    [folderChildrenMap],
  );

  useEffect(() => {
    setLocalScopeItems(scopeItems);
    const existingDocIds = scopeItems
      .filter((item) => item.type === "document")
      .map((item) => item.id);
    setSelectedDocumentIds(existingDocIds);
  }, [scopeItems]);

  const handleScopeItemsChange = (items: ScopeItem[]) => {
    setLocalScopeItems(items);
    onScopeItemsChange?.(items);
  };

  const removeScopeItem = (id: string) => {
    const newItems = localScopeItems.filter((item) => item.id !== id);
    handleScopeItemsChange(newItems);
  };

  const handleDocumentsChange = (documentIds: string[]) => {
    setSelectedDocumentIds(documentIds);
    const newScopeItems = documentIds.map((docId) => {
      const doc = documents.find((d) => d.id === docId);
      return {
        id: docId,
        name: doc?.name || docId,
        type: "document" as const,
      };
    });

    handleScopeItemsChange(newScopeItems);
  };

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: MIN_HEIGHT,
    maxHeight: MAX_HEIGHT,
  });

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isSubmitting || disabled || isLoading) return;

    setIsSubmitting(true);
    try {
      const allFolderIds = getAllNestedFolderIds(selectedFolderIds);

      const folderDocs = documents
        .filter((doc) => doc.folderId && allFolderIds.includes(doc.folderId))
        .map((doc) => doc.id);

      const scope: Scope = {
        docs: localScopeItems
          .filter((item) => item.type === "document")
          .map((item) => item.id),
        folders: selectedFolderIds,
        folderDocs,
      };
      await onSubmit(input, scope);
      setInput("");
      adjustHeight(true);
    } catch (error) {
      console.error("Error submitting message:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    input,
    isSubmitting,
    disabled,
    isLoading,
    getAllNestedFolderIds,
    selectedFolderIds,
    documents,
    localScopeItems,
    onSubmit,
    adjustHeight,
  ]);

  const handleStop = useCallback(() => {
    if (onStop) {
      onStop();
    }
  }, [onStop]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isLoading) {
        handleStop();
      } else {
        handleSubmit();
      }
    }
  };

  useEffect(() => {
    if (!disabled && !isLoading && !isSubmitting) {
      textareaRef.current?.focus();
    }
  }, [disabled, isLoading, isSubmitting]);

  const isSubmitDisabled =
    !input.trim() || isSubmitting || disabled || isLoading;

  return (
    <div className={cn("w-full", className)}>
      <DroppableChatInput
        className="relative w-full max-w-full rounded-[22px] border border-black/5 p-1"
        id="chat-input-drop-zone"
      >
        <div
          className={cn(
            "relative flex flex-col rounded-2xl border bg-neutral-800/5 transition-all duration-300",
            isLoading
              ? "border-blue-300/50 shadow-lg shadow-blue-500/10 dark:border-blue-600/50"
              : isSubmitting
                ? "border-green-300/50 shadow-lg shadow-green-500/10 dark:border-green-600/50"
                : "border-black/5",
          )}
        >
          <div
            className="overflow-y-auto"
            style={{ maxHeight: `${MAX_HEIGHT}px` }}
          >
            <div className="relative">
              <Textarea
                value={input}
                placeholder={
                  isLoading
                    ? "Generating response..."
                    : isSubmitting
                      ? "Sending message..."
                      : localScopeItems.length > 0
                        ? "Ask about the selected documents..."
                        : placeholder
                }
                className="w-full resize-none rounded-2xl rounded-b-none border-none bg-black/5 px-3 py-3 leading-[1.2] focus-visible:ring-0 dark:bg-white/5 dark:text-white"
                ref={textareaRef}
                disabled={disabled || isLoading || isSubmitting}
                onKeyDown={handleKeyDown}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustHeight();
                }}
              />
            </div>
          </div>
          <div className="flex min-h-12 items-center rounded-b-xl bg-black/5 px-3 py-1.5 dark:bg-white/5">
            <FileSelectorPopover
              documents={documents}
              selectedDocuments={selectedDocumentIds}
              onDocumentsChange={handleDocumentsChange}
              folders={folders}
            />
            <div className="flex flex-1 overflow-hidden">
              {localScopeItems.length > 0 && (
                <div className="flex items-center overflow-x-auto px-2">
                  <ScopePillsContainer
                    items={localScopeItems}
                    onRemove={removeScopeItem}
                    maxVisible={3}
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={isLoading ? handleStop : handleSubmit}
              disabled={isSubmitDisabled && !isLoading}
              className={cn(
                "shrink-0 rounded-full p-1 transition-colors focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-2",
                isSubmitDisabled && !isLoading
                  ? "cursor-not-allowed bg-muted text-muted-foreground opacity-60"
                  : isLoading
                    ? "animate-pulse bg-red-500/10 text-red-500 hover:bg-red-500/20 dark:bg-red-500/15 dark:hover:bg-red-500/25"
                    : "bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/15 dark:hover:bg-primary/25",
              )}
              title={isLoading ? "Stop generating response" : "Send message"}
            >
              {isLoading ? (
                <Square className="h-4 w-4" />
              ) : (
                <ArrowUpIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </DroppableChatInput>
    </div>
  );
}
