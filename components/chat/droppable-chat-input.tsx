"use client";

import React from "react";

import { useDroppable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";

interface DroppableChatInputProps {
  id: string;
  children: React.ReactElement;
  className?: string;
}

export function DroppableChatInput({
  id,
  children,
  className,
}: DroppableChatInputProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type: "chat-input",
    },
  });

  const childWithProps = React.cloneElement(children, {
    isOver,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-all duration-200",
        isOver && "ring-2 ring-primary/50 ring-offset-0",
        className,
      )}
    >
      {childWithProps}
    </div>
  );
}
