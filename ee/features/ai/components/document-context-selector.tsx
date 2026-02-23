"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DataroomFolder } from "@prisma/client";
import { FileTextIcon, FolderIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { DataroomDocumentForChat } from "./viewer-chat-provider";

// ============================================================================
// Types
// ============================================================================

export interface SelectedContextItem {
  type: "document" | "folder";
  id: string; // dataroomDocumentId for documents, folder.id for folders
  name: string;
}

interface DocumentContextSelectorProps {
  documents: DataroomDocumentForChat[];
  folders: DataroomFolder[];
  selectedItems: SelectedContextItem[];
  onSelectionChange: (items: SelectedContextItem[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all documents within a folder (including nested folders)
 */
function getDocumentsInFolder(
  folderId: string,
  documents: DataroomDocumentForChat[],
  folders: DataroomFolder[],
): DataroomDocumentForChat[] {
  // Get direct documents in this folder
  const directDocs = documents.filter((doc) => doc.folderId === folderId);

  // Get child folders
  const childFolders = folders.filter((f) => f.parentId === folderId);

  // Recursively get documents from child folders
  const nestedDocs = childFolders.flatMap((childFolder) =>
    getDocumentsInFolder(childFolder.id, documents, folders),
  );

  return [...directDocs, ...nestedDocs];
}

// ============================================================================
// Main Component
// ============================================================================

export function DocumentContextSelector({
  documents,
  folders,
  selectedItems,
  onSelectionChange,
  open,
  onOpenChange,
  disabled = false,
}: DocumentContextSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Reset search query when popover opens
  useEffect(() => {
    if (open) {
      setSearchQuery("");
    }
  }, [open]);

  // Handle item selection
  const handleSelect = useCallback(
    (type: "document" | "folder", id: string, name: string) => {
      // Check if already selected
      const isSelected = selectedItems.some(
        (item) => item.type === type && item.id === id,
      );

      if (isSelected) {
        // Remove if already selected
        onSelectionChange(
          selectedItems.filter(
            (item) => !(item.type === type && item.id === id),
          ),
        );
      } else {
        // Add new selection
        onSelectionChange([...selectedItems, { type, id, name }]);
      }

      // Close popover
      onOpenChange(false);
    },
    [selectedItems, onSelectionChange, onOpenChange],
  );

  // Filter items based on search query
  const filteredFolders = useMemo(() => {
    if (!searchQuery) return folders;
    const query = searchQuery.toLowerCase();
    return folders.filter((folder) =>
      folder.name.toLowerCase().includes(query),
    );
  }, [folders, searchQuery]);

  const filteredDocuments = useMemo(() => {
    if (!searchQuery) return documents;
    const query = searchQuery.toLowerCase();
    return documents.filter((doc) => doc.name.toLowerCase().includes(query));
  }, [documents, searchQuery]);

  if (disabled || (documents.length === 0 && folders.length === 0)) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <div className="sr-only" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] p-0"
        align="start"
        side="top"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandInput
            placeholder="Search documents and folders..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            autoFocus
            wrapperClassName="border-b border-border"
            className="focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-none focus:outline-none"
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No items found.</CommandEmpty>

            {filteredFolders.length > 0 && (
              <CommandGroup heading="Folders">
                {filteredFolders.map((folder) => {
                  const isSelected = selectedItems.some(
                    (item) => item.type === "folder" && item.id === folder.id,
                  );
                  const docCount = getDocumentsInFolder(
                    folder.id,
                    documents,
                    folders,
                  ).length;

                  return (
                    <CommandItem
                      key={`folder-${folder.id}`}
                      value={`folder-${folder.name}`}
                      onSelect={() =>
                        handleSelect("folder", folder.id, folder.name)
                      }
                      className={cn(
                        "flex items-center gap-2",
                        isSelected && "bg-accent",
                      )}
                    >
                      <FolderIcon className="size-4 text-muted-foreground" />
                      <span className="flex-1 truncate">{folder.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {docCount} doc{docCount !== 1 ? "s" : ""}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {filteredDocuments.length > 0 && (
              <CommandGroup heading="Documents">
                {filteredDocuments.map((doc) => {
                  const isSelected = selectedItems.some(
                    (item) =>
                      item.type === "document" &&
                      item.id === doc.dataroomDocumentId,
                  );

                  return (
                    <CommandItem
                      key={`doc-${doc.dataroomDocumentId}`}
                      value={`doc-${doc.name}`}
                      onSelect={() =>
                        handleSelect(
                          "document",
                          doc.dataroomDocumentId,
                          doc.name,
                        )
                      }
                      className={cn(
                        "flex items-center gap-2",
                        isSelected && "bg-accent",
                      )}
                    >
                      <FileTextIcon className="size-4 text-muted-foreground" />
                      <span className="flex-1 truncate">{doc.name}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Selected Items Display Component
// ============================================================================

interface SelectedContextItemsProps {
  items: SelectedContextItem[];
  onRemove: (type: "document" | "folder", id: string) => void;
}

export function SelectedContextItems({
  items,
  onRemove,
}: SelectedContextItemsProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <ContextItemAttachment
          key={`${item.type}-${item.id}`}
          item={item}
          onRemove={() => onRemove(item.type, item.id)}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Context Item Attachment Component (matches PromptInputAttachment style)
// ============================================================================

interface ContextItemAttachmentProps {
  item: SelectedContextItem;
  onRemove: () => void;
  className?: string;
}

function ContextItemAttachment({
  item,
  onRemove,
  className,
}: ContextItemAttachmentProps) {
  const Icon = item.type === "folder" ? FolderIcon : FileTextIcon;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "group relative flex h-8 cursor-pointer select-none items-center gap-1.5 rounded-md border border-border px-1.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
              className,
            )}
          >
            <div className="relative size-5 shrink-0">
              <div className="absolute inset-0 flex size-5 items-center justify-center overflow-hidden rounded bg-background transition-opacity group-hover:opacity-0">
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <Button
                aria-label="Remove from context"
                className="absolute inset-0 size-5 cursor-pointer rounded p-0 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 [&>svg]:size-3"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove();
                }}
                type="button"
                variant="ghost"
              >
                <XIcon />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
            <span className="max-w-[150px] flex-1 truncate">{item.name}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[300px]">
          <p className="break-all">{item.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// Utility Export
// ============================================================================

export { getDocumentsInFolder };
