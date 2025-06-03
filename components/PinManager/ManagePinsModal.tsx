import { useRouter } from "next/navigation";

import { useState } from "react";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FileIcon,
  FolderIcon,
  GripVertical,
  Pin,
  ServerIcon,
  X,
} from "lucide-react";

import { PinnedItem, usePins } from "@/lib/context/pin-context";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const getItemId = (item: PinnedItem): string => {
  return (
    item.id ||
    item.documentId ||
    item.folderId ||
    item.dataroomId ||
    item.dataroomDocumentId ||
    item.dataroomFolderId ||
    "unknown"
  );
};

interface ManagePinsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ItemIcon = ({ type }: { type: PinnedItem["pinType"] }) => {
  switch (type) {
    case "FOLDER":
    case "DATAROOM_FOLDER":
      return <FolderIcon size={12} />;
    case "DOCUMENT":
    case "DATAROOM_DOCUMENT":
      return <FileIcon size={12} />;
    case "DATAROOM":
      return <ServerIcon size={12} />;
  }
};

interface SortablePinItemProps {
  item: PinnedItem;
  onRemove: (id: string) => void;
  onItemClick: (item: PinnedItem) => void;
}

function SortablePinItem({
  item,
  onRemove,
  onItemClick,
}: SortablePinItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: getItemId(item),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center rounded-md border px-2 py-2 transition-colors hover:bg-accent/50",
        isDragging ? "opacity-50" : "",
      )}
    >
      {/* Drag Handle */}
      <div
        className="flex h-6 items-center px-1.5 text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical
          className={cn(
            "h-3 w-3",
            isDragging ? "cursor-grabbing" : "cursor-grab",
          )}
        />
      </div>

      {/* Item Icon and Name */}
      <div
        className="flex flex-1 cursor-pointer items-center space-x-2 overflow-hidden"
        onClick={() => onItemClick(item)}
      >
        <div className="text-muted-foreground">
          <ItemIcon type={item.pinType} />
        </div>
        <span className="max-w-[350px] truncate text-sm text-muted-foreground group-hover:text-foreground">
          {item.name}
        </span>
      </div>

      {/* Remove Button - Only visible on hover */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100"
        onClick={() => onRemove(getItemId(item))}
      >
        <X className="h-3 w-3" />
        <span className="sr-only">Remove {item.name}</span>
      </Button>
    </div>
  );
}

function EmptyPinnedState() {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <h3 className="text-lg font-semibold">No pinned items</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Pin folders, documents or datarooms to quickly access them from
          anywhere. You can pin items using the pin icon in their dropdown
          menus.
        </p>
      </div>
    </div>
  );
}

export function ManagePinsModal({ open, onOpenChange }: ManagePinsModalProps) {
  const { pinnedItems, removePinnedItem, reorderPinnedItems } = usePins();
  const [activeId, setActiveId] = useState<string | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!active || !over || active.id === over.id) return;

    const oldIndex = pinnedItems.findIndex(
      (item) => getItemId(item) === active.id,
    );
    const newIndex = pinnedItems.findIndex(
      (item) => getItemId(item) === over.id,
    );

    if (oldIndex === -1 || newIndex === -1) return;

    const items = [...pinnedItems];
    const [removed] = items.splice(oldIndex, 1);
    items.splice(newIndex, 0, removed);
    reorderPinnedItems(items);
  };

  const handleItemClick = (item: PinnedItem) => {
    let path = "";
    switch (item.pinType) {
      case "DOCUMENT":
      case "DATAROOM_DOCUMENT":
        path = `/documents/${item.documentId}`;
        break;
      case "FOLDER":
        path = `/documents/tree${item.path || ""}`;
        break;
      case "DATAROOM":
        path = `/datarooms/${item.dataroomId}/documents`;
        break;
      case "DATAROOM_FOLDER":
        path = `/datarooms/${item.dataroomId}/documents${item.path || ""}`;
        break;
    }
    try {
      router.push(path);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to navigate to pinned item:", error);
    }
  };

  const activeItem = activeId
    ? pinnedItems.find((item) => getItemId(item) === activeId)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Favorites</DialogTitle>
          <DialogDescription>
            Drag to reorder your pinned items or click the X icon to unpin them.
            Pinned items appear in the top bar for quick access.
          </DialogDescription>
        </DialogHeader>
        <div className="relative py-4">
          {pinnedItems.length > 0 ? (
            <ScrollArea className="max-h-[350px] w-full" type="always">
              <div className="w-full">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={pinnedItems.map((item) => ({
                      id: getItemId(item),
                    }))}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1.5">
                      {pinnedItems.map((item) => (
                        <SortablePinItem
                          key={getItemId(item)}
                          item={item}
                          onRemove={removePinnedItem}
                          onItemClick={handleItemClick}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activeItem && (
                      <SortablePinItem
                        item={activeItem}
                        onRemove={removePinnedItem}
                        onItemClick={handleItemClick}
                      />
                    )}
                  </DragOverlay>
                </DndContext>
              </div>
            </ScrollArea>
          ) : (
            <EmptyPinnedState />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
