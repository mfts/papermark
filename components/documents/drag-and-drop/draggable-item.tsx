import React, { useCallback, useState } from "react";

import { useDraggable } from "@dnd-kit/core";

import { Checkbox } from "@/components/ui/checkbox";

import { cn } from "@/lib/utils";

interface DraggableItemProps {
  id: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  isDraggingSelected: boolean;
  children: React.ReactElement;
}

export function DraggableItem({
  id,
  isSelected,
  onSelect,
  isDraggingSelected,
  children,
}: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: id,
    data: {
      type: "document",
      id: id,
      name: children.props.document.name,
      contentType: children.props.document.type,
    },
  });

  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    onSelect(id);
  }, [id, onSelect]);

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
    <li
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
    </li>
  );
}
