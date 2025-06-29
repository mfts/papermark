import { Fragment, useEffect, useRef, useState } from "react";

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
import { FileIcon, GripVerticalIcon, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import {
  ButtonTooltip,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useDocumentTabs } from "./hooks/useDocumentTabs";

interface DocumentTab {
  id: string;
  title: string;
}

interface SortableTabProps {
  tab: DocumentTab;
  isActive: boolean;
  onClose: (id: string, e: React.MouseEvent) => void;
  onClick: () => void;
  isDraggingAny: boolean;
}

function SortableTab({
  tab,
  isActive,
  onClose,
  onClick,
  isDraggingAny,
}: SortableTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          className={cn(
            "group relative flex h-7 items-center rounded-md px-2 text-[13px] font-normal transition-all",
            "hover:bg-accent/50 hover:text-foreground",
            isActive ? "bg-accent/50 text-foreground" : "text-muted-foreground",
            isDragging ? "opacity-50" : "",
          )}
        >
          <div
            className="flex h-full items-center"
            {...(attributes && typeof attributes === "object"
              ? attributes
              : {})}
            {...(listeners && typeof listeners === "object" ? listeners : {})}
          >
            <GripVerticalIcon
              className={cn(
                "h-3 w-3 transition-colors",
                isDragging ? "cursor-grabbing" : "cursor-grab",
                "group-hover:text-foreground",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            />
          </div>
          <button
            type="button"
            className="flex h-full items-center space-x-1.5 pl-1.5"
            onClick={onClick}
          >
            <FileIcon
              className={cn(
                "h-3.5 w-3.5 transition-colors",
                "group-hover:text-foreground",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            />
            <span className="max-w-[120px] truncate transition-colors">
              {tab.title}
            </span>
          </button>
          {!isDraggingAny && (
            <div
              className={cn(
                "absolute right-0 top-0 h-full w-10 transition-opacity",
                "pointer-events-none opacity-0 group-hover:opacity-100",
                "bg-gradient-to-l",
                isActive
                  ? "from-accent from-50% via-accent/90 via-70% to-transparent"
                  : "from-background from-50% via-background/95 via-70% to-transparent",
              )}
            />
          )}
          {/* Close button - hidden during drag */}
          {!isDraggingAny && (
            <button
              type="button"
              className={cn(
                "absolute -top-[4px] right-0.5 flex h-[18px] w-[18px] translate-y-1/2 items-center justify-center rounded-sm",
                "opacity-0 transition-all group-hover:opacity-100",
                "bg-gray-800 text-white hover:bg-gray-700",
                "border border-gray-600 shadow-md",
                "dark:border-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600",
              )}
              onClick={(e) => onClose(tab.id, e)}
            >
              <X className="h-3 w-3 shrink-0" />
              <span className="sr-only">Close tab</span>
            </button>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{tab.title}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function useMainContentWidth() {
  const [width, setWidth] = useState<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    const updateWidth = () => {
      const rect = mainContent.getBoundingClientRect();
      setWidth(rect.width);
    };
    updateWidth();
    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(() => {
        updateWidth();
      });
      resizeObserverRef.current.observe(mainContent);
    }
    window.addEventListener("resize", updateWidth);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.removeEventListener("resize", updateWidth);
    };
  }, []);
  return width;
}

export function DocumentTabs() {
  const { state } = useSidebar();
  const mainContentWidth = useMainContentWidth();
  const {
    tabs,
    activeId,
    handleTabChange,
    handleTabClose,
    reorderTabs,
    pinCurrentTab,
    isOnDocumentPage,
    isCurrentTabTemporary,
  } = useDocumentTabs();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<number | null>(null);
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
        delay: 100,
        tolerance: 10,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    try {
      if (event?.active?.id) {
        setIsDragging(true);
        setDragStartTime(Date.now());
        setDraggingTabId(event.active.id as string);
      }
    } catch (error) {
      console.error("Error in handleDragStart:", error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    try {
      setIsDragging(false);
      setDraggingTabId(null);
      const dragDuration = dragStartTime ? Date.now() - dragStartTime : 0;
      setDragStartTime(null);

      if (!event?.active || !event?.over) return;

      const { active, over } = event;

      if (over && active.id !== over.id && active.id && over.id) {
        const oldIndex = tabs.findIndex((item) => item.id === active.id);
        const newIndex = tabs.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          reorderTabs(oldIndex, newIndex);
        }
      } else if (active.id === over?.id && dragDuration < 200) {
        // Only change tab if it was a quick drag (likely intended as a click)
        // and the item was dropped on itself
        handleTabChange(active.id as string);
      }
    } catch (error) {
      console.error("Error in handleDragEnd:", error);
    }
  };

  const closeTab = (tabId: string, event: React.MouseEvent) => {
    try {
      event.stopPropagation();
      handleTabClose(tabId);
    } catch (error) {
      console.error("Error in closeTab:", error);
    }
  };

  const handleTabClick = (tabId: string) => {
    // Only handle tab change if we're not currently dragging
    if (!isDragging) {
      handleTabChange(tabId);
    }
  };

  const handlePinTab = () => {
    try {
      pinCurrentTab();
    } catch (error) {
      console.error("Error pinning tab:", error);
    }
  };

  if (tabs.length === 0) return null;

  const activeTab = draggingTabId
    ? tabs.find((tab) => tab.id === draggingTabId)
    : activeId
      ? tabs.find((tab) => tab.id === activeId)
      : null;
  const showPlusButton = isOnDocumentPage() && isCurrentTabTemporary();

  const dynamicStyle = mainContentWidth
    ? { width: `${mainContentWidth}px` }
    : {};
  const fallbackClassName = !mainContentWidth
    ? state === "expanded"
      ? "w-screen md:w-[calc(100vw-var(--sidebar-width)-12px)]"
      : "w-screen md:w-[calc(100vw-var(--sidebar-width-icon)-28px)]"
    : "";

  return (
    <div
      className={cn(
        "flex h-7 shrink-0 items-center border-b border-border",
        fallbackClassName,
      )}
      style={dynamicStyle}
    >
      <div className="relative flex w-full items-center px-3">
        <ScrollArea className="w-full" type="always">
          <div className="flex w-full items-center space-x-3">
            <div className="flex min-w-0 items-center space-x-2">
              <FileIcon size={14} className="shrink-0 text-muted-foreground" />
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
                  items={tabs.map((tab) => ({ id: tab.id }))}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {tabs.map((tab, index) => (
                      <Fragment key={tab.id}>
                        <div className="flex items-center">
                          <SortableTab
                            tab={tab}
                            isActive={tab.id === activeId}
                            onClose={closeTab}
                            onClick={() => handleTabClick(tab.id)}
                            isDraggingAny={isDragging}
                          />
                        </div>
                        {index < tabs.length - 1 && (
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
                  {activeTab && (
                    <SortableTab
                      tab={activeTab}
                      isActive={true}
                      onClose={() => {}}
                      onClick={() => {}}
                      isDraggingAny={isDragging}
                    />
                  )}
                </DragOverlay>
              </DndContext>
            </div>
          </div>
          <ScrollBar orientation="horizontal" className="hidden h-2" />
        </ScrollArea>
        {showPlusButton && (
          <div className="relative flex items-center">
            <Separator orientation="vertical" className="h-4 bg-border" />
            <ButtonTooltip content="Pin this tab to keep it in your workspace">
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 h-6 w-6 rounded-sm p-0 hover:bg-accent/50"
                onClick={handlePinTab}
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="sr-only">Pin tab</span>
              </Button>
            </ButtonTooltip>
          </div>
        )}
      </div>
    </div>
  );
}
