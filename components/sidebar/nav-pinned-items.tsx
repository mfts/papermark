import { useRouter } from "next/router";

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
import {
  ChevronRight,
  FileText,
  Folder,
  GripVertical,
  Server,
  Settings2,
  Star,
} from "lucide-react";

import { PinType, PinnedItem, usePins } from "@/lib/context/pin-context";
import { cn } from "@/lib/utils";

import { ManagePinsModal } from "@/components/PinManager/ManagePinsModal";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";

import { ButtonTooltip, Tooltip } from "../ui/tooltip";

// Helper function to get icon based on PinType
const getIconForPinType = (pinType: PinType) => {
  switch (pinType) {
    case "DOCUMENT":
    case "DATAROOM_DOCUMENT":
      return FileText;
    case "FOLDER":
    case "DATAROOM_FOLDER":
      return Folder;
    case "DATAROOM":
      return Server;
    default:
      return FileText;
  }
};

interface SortablePinnedItemProps {
  item: PinnedItem;
  onItemClick: (item: PinnedItem) => void;
  router: any;
}

function SortablePinnedItem({
  item,
  onItemClick,
  router,
}: SortablePinnedItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id || item.name,
  });

  const style =
    transform &&
    typeof transform === "object" &&
    "x" in transform &&
    "y" in transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          transition,
        }
      : undefined;

  const IconComponent = getIconForPinType(item.pinType);

  const getCurrentPath = () => {
    switch (item.pinType) {
      case "DOCUMENT":
        return `/documents/${item.documentId}`;
      case "FOLDER":
        return `/documents/tree${item.path || ""}`;
      case "DATAROOM":
        return `/datarooms/${item.dataroomId}/documents`;
      case "DATAROOM_DOCUMENT":
        return `/datarooms/${item.dataroomId}/documents/${item.dataroomDocumentId}`;
      case "DATAROOM_FOLDER":
        return `/datarooms/${item.dataroomId}/documents${item.path || ""}`;
      default:
        return "";
    }
  };

  const currentPath = getCurrentPath();
  const current =
    router.asPath === currentPath ||
    (currentPath && router.asPath.startsWith(currentPath));

  return (
    <SidebarMenuSubItem
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative",
        current && "rounded-md bg-gray-200 font-semibold dark:bg-secondary",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex items-center">
        <div
          className="flex h-6 w-6 cursor-grab items-center justify-center"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
        <SidebarMenuSubButton asChild className="w-full">
          <button
            onClick={() => onItemClick(item)}
            className="flex w-full items-center gap-2 text-left"
          >
            <IconComponent className="h-4 w-4 shrink-0" />
            <span className="truncate text-sm">{item.name}</span>
          </button>
        </SidebarMenuSubButton>
      </div>
    </SidebarMenuSubItem>
  );
}

export function NavPinnedItems() {
  const { pinnedItems, isLoading, reorderPinnedItems } = usePins();
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const { toggleSidebar } = useSidebar();

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
        path = `/documents/${item.documentId}`;
        break;
      case "FOLDER":
        path = `/documents/tree${item.path || ""}`;
        break;
      case "DATAROOM":
        path = `/datarooms/${item.dataroomId}/documents`;
        break;
      case "DATAROOM_DOCUMENT":
        path = `/datarooms/${item.dataroomId}/documents/${item.dataroomDocumentId}`;
        break;
      case "DATAROOM_FOLDER":
        path = `/datarooms/${item.dataroomId}/documents${item.path || ""}`;
        break;
    }
    if (path) {
      router.push(path);
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
        (item) => (item.id || item.name) === active.id,
      );
      const newIndex = pinnedItems.findIndex(
        (item) => (item.id || item.name) === over.id,
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const items = [...pinnedItems];
        const [removed] = items.splice(oldIndex, 1);
        items.splice(newIndex, 0, removed);
        reorderPinnedItems(items);
      }
    }
  };

  const activeItem = activeId
    ? pinnedItems.find((item) => (item.id || item.name) === activeId)
    : null;

  const handleFavIconClick = () => {
    toggleSidebar();
  };

  if (!pinnedItems || pinnedItems.length === 0) {
    return null;
  }

  const hasPinnedItems = pinnedItems.length > 0;

  return (
    <SidebarGroup>
      <SidebarMenu className="space-y-0.5 text-foreground group-data-[collapsible=icon]:hidden">
        <Collapsible asChild defaultOpen={true}>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Favorites">
              <div className="flex w-full items-center gap-2 p-2">
                <Star className="h-4 w-4" />
                <span>Favorites</span>
              </div>
            </SidebarMenuButton>
            {hasPinnedItems && (
              <>
                <ButtonTooltip content="Manage Favorites">
                  <SidebarMenuAction
                    onClick={() => setIsManageOpen(true)}
                    className="mr-6 mt-[-2px] flex h-6 w-6 items-center justify-center hover:bg-accent hover:text-accent-foreground"
                  >
                    <Settings2 className="h-3 w-3" />
                    <span className="sr-only">Manage Favorites</span>
                  </SidebarMenuAction>
                </ButtonTooltip>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction className="data-[state=open]:rotate-90">
                    <ChevronRight />
                    <span className="sr-only">Toggle</span>
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={pinnedItems.map((item) => item.id || item.name)}
                      strategy={verticalListSortingStrategy}
                    >
                      <SidebarMenuSub className="mr-0 pr-0">
                        {pinnedItems.map((item) => (
                          <SortablePinnedItem
                            key={item.id || item.name}
                            item={item}
                            onItemClick={handleItemClick}
                            router={router}
                          />
                        ))}
                      </SidebarMenuSub>
                    </SortableContext>
                    <DragOverlay>
                      {activeItem && (
                        <SortablePinnedItem
                          item={activeItem}
                          onItemClick={handleItemClick}
                          router={router}
                        />
                      )}
                    </DragOverlay>
                  </DndContext>
                </CollapsibleContent>
              </>
            )}
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
      <SidebarMenu className="hidden space-y-0.5 text-foreground group-data-[collapsible=icon]:flex">
        <SidebarMenuItem>
          <SidebarMenuButton
            size="sm"
            onClick={handleFavIconClick}
            tooltip="Favorites"
            className="h-8 w-8"
          >
            <Star className="h-4 w-4" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <ManagePinsModal open={isManageOpen} onOpenChange={setIsManageOpen} />
    </SidebarGroup>
  );
}
