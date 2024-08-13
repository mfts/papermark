import React from "react";

import { useDroppable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";

interface DroppableFolderProps {
  id: string;
  children: React.ReactElement;
}

export function DroppableFolder({ id, children }: DroppableFolderProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: { type: "folder", id: id },
  });

  const childWithProps = React.cloneElement(children, {
    isOver,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        isOver && "rounded-lg ring-2 ring-black dark:ring-gray-100",
      )}
    >
      {childWithProps}
    </div>
  );
}
