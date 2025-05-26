import React, { useCallback, useState } from "react";

import { useDraggable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";

import { Checkbox } from "@/components/ui/checkbox";

interface DraggableItemProps {
  id: string;
  isSelected: boolean;
  onSelect: (id: string, type: "document" | "folder") => void;
  isDraggingSelected: boolean;
  children: React.ReactElement;
  type: "document" | "folder";
}

export function DraggableItem({
  id,
  isSelected,
  onSelect,
  isDraggingSelected,
  children,
  type,
}: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: id,
    data: {
      type: type,
      id: id,
      name:
        type === "folder"
          ? children.props.folder.name
          : children.props.document.name,
      contentType:
        type === "folder"
          ? children.props.folder.type
          : children.props.document.type,
      parentFolderId:
        type === "folder"
          ? children.props.folder.parentId
          : children.props.document.folderId,
    },
  });

  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    onSelect(id, type);
  }, [id, onSelect, type]);

  const style = {
    opacity: isSelected && isDraggingSelected ? 0.5 : 1,
    // transform: CSS.Transform.toString(transform),
  };

  const childWithProps = React.cloneElement(children, {
    isDragging,
    isSelected,
    isHovered,
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      // onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative transition-all duration-100",
        isSelected ? "rounded-lg ring-2 ring-black dark:ring-gray-100" : "",
      )}
    >
      {/* <div className="absolute left-2 top-3 z-50 hidden h-14 w-14 items-center justify-center bg-secondary group-hover:flex"> */}
      <div
        className={cn(
          "absolute left-4 top-6 z-[49] hidden items-center justify-center group-hover:flex sm:left-6 sm:top-7",
          isSelected ? "flex" : "",
        )}
      >
        <Checkbox
          className="h-6 w-6"
          checked={isSelected}
          onCheckedChange={handleClick}
        />
      </div>
      {childWithProps}
    </div>
  );
}
