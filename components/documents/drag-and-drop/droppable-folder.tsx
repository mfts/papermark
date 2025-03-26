import React from "react";

import { useDroppable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";

interface DroppableFolderProps {
  id: string;
  disabledFolder: string[];
  children: React.ReactElement;
  path: string;
}

export function DroppableFolder({
  id,
  disabledFolder,
  children,
  path,
}: DroppableFolderProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: { type: "folder", id, path },
  });

  const childWithProps = React.cloneElement(children, {
    isOver,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        isOver &&
          !disabledFolder.includes(id) &&
          "rounded-lg ring-2 ring-black dark:ring-gray-100",
      )}
    >
      {childWithProps}
    </div>
  );
}
