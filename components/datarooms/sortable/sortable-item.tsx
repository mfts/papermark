import React from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type ItemCategory = "folder" | "document";

interface SortableItemProps {
  id: string;
  category: ItemCategory;
  children: React.ReactElement;
}

export const SortableItem: React.FC<SortableItemProps> = ({
  id,
  category,
  children,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({
      id: id,
      data: {
        category: category,
        id: id.replace(category, ""),
      },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const childWithProps = React.cloneElement(children, {
    isDragging,
  });

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-move *:pointer-events-none"
    >
      {childWithProps}
    </li>
  );
};
