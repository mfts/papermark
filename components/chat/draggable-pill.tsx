"use client";

import React from "react";

import { useDraggable } from "@dnd-kit/core";
import { FileIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import Folder from "../shared/icons/folder";

export interface DraggablePillProps {
  id: string;
  type: "document" | "folder";
  name: string;
  className?: string;
}

export function DraggablePill({
  id,
  type,
  name,
  className,
}: DraggablePillProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: id,
    data: {
      type: type,
      id: id,
      name: name,
    },
  });

  const getIcon = () => {
    if (type === "folder") {
      return <Folder className="h-4 w-4" />;
    }
    return <FileIcon className="h-4 w-4" />;
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "inline-flex cursor-grab items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15 active:cursor-grabbing",
        isDragging && "opacity-50",
        className,
      )}
    >
      {getIcon()}
      <span className="max-w-[120px] truncate">{name}</span>
    </div>
  );
}
