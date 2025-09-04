"use client";

import React from "react";

import { useDraggable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";

export interface DraggableCardProps {
  id: string;
  type: "document" | "folder";
  name: string;
  children: React.ReactElement;
  className?: string;
}

export function DraggableCard({
  id,
  type,
  name,
  children,
  className,
}: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: id,
    data: {
      type: type,
      id: id,
      name: name,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab transition-opacity",
        isDragging && "opacity-50",
        className,
      )}
    >
      {children}
    </div>
  );
}
