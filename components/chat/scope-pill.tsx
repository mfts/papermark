"use client";

import { FileIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";

import Folder from "../shared/icons/folder";

export interface ScopeItem {
  id: string;
  type: "document" | "folder";
  name: string;
}

interface ScopePillProps {
  item: ScopeItem;
  onRemove: (id: string) => void;
  className?: string;
}

export function ScopePill({ item, onRemove, className }: ScopePillProps) {
  const getIcon = () => {
    if (item.type === "folder") {
      return <Folder className="h-3 w-3" />;
    }
    return <FileIcon className="h-3 w-3" />;
  };

  return (
    <div
      className={cn(
        "group relative inline-flex items-center rounded-md bg-primary/10 text-xs font-medium text-primary transition-colors hover:bg-primary/15",
        className,
      )}
    >
      <div className="relative pl-1.5 pr-1.5">
        <div className="h-3 w-3 group-hover:hidden">{getIcon()}</div>
        <button
          type="button"
          className="hidden h-3 w-3 hover:bg-transparent group-hover:flex group-focus-within:flex focus-visible:flex focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.name}`}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <span className="max-w-[100px] truncate py-1 pr-1.5">{item.name}</span>
    </div>
  );
}
