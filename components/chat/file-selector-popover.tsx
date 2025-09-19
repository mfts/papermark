"use client";

import React, { useMemo, useState } from "react";

import { AtSignIcon, Check } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Document {
  id: string;
  name: string;
  folderId: string | null;
}

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

interface FileSelectorPopoverProps {
  documents: Document[];
  folders: Folder[];
  selectedDocuments: string[];
  onDocumentsChange: (documentIds: string[]) => void;
  className?: string;
}

export function FileSelectorPopover({
  documents,
  selectedDocuments,
  onDocumentsChange,
  className,
  folders,
}: FileSelectorPopoverProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) {
      return documents;
    }
    return documents.filter((doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [documents, searchQuery]);

  const handleDocumentToggle = (documentId: string) => {
    const isSelected = selectedDocuments.includes(documentId);
    if (isSelected) {
      onDocumentsChange(selectedDocuments.filter((id) => id !== documentId));
    } else {
      onDocumentsChange([...selectedDocuments, documentId]);
    }
  };

  const getDocumentPath = (document: Document): string | null => {
    if (!document.folderId) return null;

    const folder = folders.find((f) => f.id === document.folderId);
    if (!folder) return null;

    const pathParts: string[] = [folder.name];
    let currentFolder = folder;

    while (currentFolder.parentId) {
      const parentFolder = folders.find((f) => f.id === currentFolder.parentId);
      if (!parentFolder) break;
      pathParts.unshift(parentFolder.name);
      currentFolder = parentFolder;
    }

    return pathParts.join("/");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex shrink-0 flex-row rounded-md p-1 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-2",
            "bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/15 dark:hover:bg-primary/25",
            className,
          )}
          title="Add files to chat"
        >
          <AtSignIcon className="h-4 w-4" />
          {selectedDocuments.length === 0 && (
            <span className="pl-1 text-xs font-medium">Add files</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="border-b">
          <div className="relative">
            <input
              id="file-search-input"
              name="file-search-input"
              type="text"
              aria-label="Search files"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="h-7 w-full border-none bg-transparent text-xs outline-none placeholder:text-muted-foreground/60 focus:border-none focus:ring-0"
            />
          </div>
        </div>

        <div className="max-h-48 overflow-y-auto">
          <div className="p-1">
            {filteredDocuments.length === 0 ? (
              <div className="py-3 text-center text-xs text-muted-foreground">
                {searchQuery ? "No documents found" : "No documents available"}
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredDocuments.map((document) => {
                  const isSelected = selectedDocuments.includes(document.id);
                  return (
                    <button
                      key={document.id}
                      type="button"
                      onClick={() => handleDocumentToggle(document.id)}
                      className={cn(
                        "flex w-full cursor-pointer items-center space-x-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-muted/50",
                        isSelected && "bg-muted/30",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex w-full items-center">
                          <span className="block min-w-0 flex-auto truncate text-xs font-medium text-foreground">
                            {document.name}
                          </span>
                          {getDocumentPath(document) && (
                            <span
                              className="ml-2 block flex-shrink-0 truncate text-[10px] text-muted-foreground"
                              title={`/${getDocumentPath(document)}`}
                            >
                              {(() => {
                                const path = `/${getDocumentPath(document)}`;
                                if (path.length > 18) {
                                  const parts = path.split("/");
                                  return "/" + parts[parts.length - 1];
                                }
                                return path;
                              })()}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-3 w-3 flex-shrink-0 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
