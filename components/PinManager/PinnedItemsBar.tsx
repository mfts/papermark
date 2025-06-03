import { useRouter } from "next/navigation";

import { Fragment, useState } from "react";

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
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FileIcon,
  FolderIcon,
  GripVerticalIcon,
  PinIcon,
  ServerIcon,
  Settings2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { PinnedItem, usePins } from "@/lib/context/pin-context";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ButtonTooltip,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useSidebar } from "../ui/sidebar";
import { ManagePinsModal } from "./ManagePinsModal";

const getPinItemId = (item: PinnedItem): string => {
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

const ItemIcon = ({ type }: { type: PinnedItem["pinType"] }) => {
  switch (type) {
    case "FOLDER":
    case "DATAROOM_FOLDER":
      return <FolderIcon />;
    case "DOCUMENT":
    case "DATAROOM_DOCUMENT":
      return <FileIcon />;
    case "DATAROOM":
      return <ServerIcon />;
  }
};

interface SortablePinProps {
  item: PinnedItem;
  onItemClick: (item: PinnedItem) => void;
  onRemove: (item: PinnedItem) => void;
}

function SortablePin({ item, onItemClick, onRemove }: SortablePinProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: getPinItemId(item),
  });

  const style = transform
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
      }
    : undefined;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          className={cn(
            "group relative flex items-center rounded-md transition-colors",
            isDragging ? "opacity-50" : "",
          )}
        >
          <div
            className="flex h-7 items-center px-1.5 hover:bg-accent/50"
            {...attributes}
            {...listeners}
          >
            <GripVerticalIcon
              className={cn(
                "h-3 w-3 text-muted-foreground",
                isDragging ? "cursor-grabbing" : "cursor-grab",
              )}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="relative h-7 pl-0 pr-2 text-xs hover:bg-transparent [&_svg]:size-4"
            onClick={() => onItemClick(item)}
          >
            <div className="flex items-center space-x-1.5">
              <ItemIcon type={item.pinType} />
              <span className="max-w-[120px] truncate text-[13px] text-foreground">
                {item.name}
              </span>
            </div>
          </Button>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{item.name}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function PinnedItemsBar() {
  const [isManageOpen, setIsManageOpen] = useState(false);
  const { pinnedItems, reorderPinnedItems, removePinnedItem } = usePins();
  const [activeId, setActiveId] = useState<string | null>(null);
  const router = useRouter();
  const { state } = useSidebar();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
        delay: 0,
      },
    }),
  );

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
    } catch (error) {
      console.error("Failed to navigate to pinned item:", error);
    }
  };

  const handleRemovePin = (item: PinnedItem) => {
    if (item.id) {
      removePinnedItem(item.id);
      toast.success("Item unpinned");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = pinnedItems.findIndex(
        (item) => getPinItemId(item) === active.id,
      );
      const newIndex = pinnedItems.findIndex(
        (item) => getPinItemId(item) === over.id,
      );

      const items = [...pinnedItems];
      const [removed] = items.splice(oldIndex, 1);
      items.splice(newIndex, 0, removed);
      reorderPinnedItems(items);
    }
  };

  const activeItem = activeId
    ? pinnedItems.find((item) => getPinItemId(item) === activeId)
    : null;

  if (pinnedItems.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex h-7 shrink-0 items-center border-b border-border",
        state === "expanded"
          ? "w-screen md:w-[calc(100vw-var(--sidebar-width)-12px)]"
          : "w-screen md:w-[calc(100vw-var(--sidebar-width-icon)-28px)]",
      )}
    >
      <div className="flex w-full items-center px-3">
        <ScrollArea className="w-full" type="always">
          <div className="flex w-full items-center space-x-3">
            {/* Pinned Items */}
            {pinnedItems.length > 0 && (
              <div className="flex min-w-0 items-center space-x-2">
                <PinIcon size={14} className="shrink-0 text-muted-foreground" />
                <Separator
                  orientation="vertical"
                  className="h-4 shrink-0 bg-border"
                />
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={pinnedItems.map((item) => ({
                      id: getPinItemId(item),
                    }))}
                    strategy={horizontalListSortingStrategy}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {pinnedItems.map((item, index) => (
                        <Fragment key={getPinItemId(item)}>
                          <div className="flex items-center">
                            <SortablePin
                              item={item}
                              onItemClick={handleItemClick}
                              onRemove={handleRemovePin}
                            />
                          </div>
                          {index < pinnedItems.length - 1 && (
                            <Separator
                              orientation="vertical"
                              className="h-4 bg-border"
                            />
                          )}
                        </Fragment>
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activeItem && (
                      <SortablePin
                        item={activeItem}
                        onItemClick={handleItemClick}
                        onRemove={handleRemovePin}
                      />
                    )}
                  </DragOverlay>
                </DndContext>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" className="hidden h-2" />
        </ScrollArea>
        <div className="relative flex items-center">
          <div className="absolute right-full h-full w-8 bg-gradient-to-r from-transparent to-background" />
          <Separator orientation="vertical" className="h-4 bg-border" />
        </div>
        <ButtonTooltip content="Manage Favorites" sideOffset={4}>
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 h-7 w-7"
            onClick={() => setIsManageOpen(true)}
          >
            <Settings2Icon className="h-3.5 w-3.5" />
            <span className="sr-only">Manage Favorites</span>
          </Button>
        </ButtonTooltip>
      </div>

      <ManagePinsModal open={isManageOpen} onOpenChange={setIsManageOpen} />
    </div>
  );
}
