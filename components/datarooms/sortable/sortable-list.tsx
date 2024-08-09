import { useState } from "react";
import React from "react";

import { TeamContextType } from "@/context/team-context";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CheckIcon } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import DataroomDocumentCard from "@/components/datarooms/dataroom-document-card";
import FolderCard from "@/components/documents/folder-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import {
  DataroomFolderDocument,
  DataroomFolderWithCount,
} from "@/lib/swr/use-dataroom";

import { SortableItem } from "./sortable-item";

type FolderOrDocument =
  | (DataroomFolderWithCount & { itemType: "folder" })
  | (DataroomFolderDocument & { itemType: "document" });

export function DataroomSortableList({
  mixedItems,
  teamInfo,
  dataroomId,
  setIsReordering,
}: {
  mixedItems: FolderOrDocument[] | undefined;
  teamInfo: TeamContextType | null;
  dataroomId: string;
  setIsReordering: (isReordering: boolean) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState<FolderOrDocument[]>(mixedItems ?? []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId !== overId) {
      setItems((prevItems) => {
        const oldIndex = prevItems.findIndex(
          (item) => `${item.itemType}-${item.id}` === activeId,
        );
        const newIndex = prevItems.findIndex(
          (item) => `${item.itemType}-${item.id}` === overId,
        );
        const newOrder = arrayMove(prevItems, oldIndex, newIndex);
        return newOrder;
      });
    }

    setActiveId(null);
  };

  const handleSave = async () => {
    // if nothing changed just return
    if (items.every((item, index) => item.id === mixedItems?.[index].id)) {
      setIsReordering(false);
      return;
    }

    const newOrder = items.map((item, index) => ({
      category: item.itemType,
      id: item.id,
      orderIndex: index,
    }));

    try {
      // Make API call to save the new order
      console.log("Saving new order:", newOrder);
      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newOrder),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save new order");
      }

      // Update local data using SWR's mutate
      mutate(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/folders?root=true`,
      );
      mutate(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/documents`,
      );
      setIsReordering(false);
      toast.success("Index saved successfully");
    } catch (error) {
      console.error("Failed to save new order:", error);
      toast.error("Failed to save index");
      // Optionally, show an error message to the user
    } finally {
      setIsReordering(false);
    }
  };

  const renderItem = (item: FolderOrDocument) => {
    const itemId = `${item.itemType}-${item.id}`;

    return (
      <SortableItem key={itemId} id={itemId} category={item.itemType}>
        {item.itemType === "folder" ? (
          <FolderCard
            folder={item}
            teamInfo={teamInfo}
            isDataroom={!!dataroomId}
            dataroomId={dataroomId}
          />
        ) : (
          <DataroomDocumentCard
            document={item as DataroomFolderDocument}
            teamInfo={teamInfo}
            dataroomId={dataroomId}
          />
        )}
      </SortableItem>
    );
  };

  const activeItem = activeId
    ? items.find((item) => `${item.itemType}-${item.id}` === activeId)
    : null;

  return (
    <div className="relative rounded-lg border-2 border-dashed border-gray-400 p-2">
      <Button
        onClick={handleSave}
        variant={"outline"}
        size="sm"
        className="absolute right-[-2px] top-[-66px] gap-x-1"
      >
        <CheckIcon className="size-4" />
        Save index
      </Button>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        <SortableContext
          items={items.map((item) => `${item.itemType}-${item.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <ul role="list" className="relative space-y-4">
            {items.map(renderItem)}
          </ul>
        </SortableContext>
        <DragOverlay>
          {activeItem ? (
            <div
              style={{
                transform: "scale(0.7)",
                opacity: 1,
                pointerEvents: "none",
                boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
              }}
            >
              {activeItem.itemType === "folder" ? (
                <FolderCard
                  folder={activeItem}
                  teamInfo={teamInfo}
                  isDataroom={!!dataroomId}
                  dataroomId={dataroomId}
                />
              ) : (
                <DataroomDocumentCard
                  document={activeItem}
                  teamInfo={teamInfo}
                  dataroomId={dataroomId}
                />
              )}
            </div>
          ) : null}
        </DragOverlay>
        {/* <DragOverlay>
            {activeId && activeId.startsWith("document-") && (
              <div className="opacity-50">
                {renderItem(
                  items.find(
                    (item) =>
                      !isFolder(item) && `document-${item.id}` === activeId,
                  )!,
                )}
              </div>
            )}
          </DragOverlay> */}
      </DndContext>
      {/* <div className="space-y-4"> */}
      {/* Folders list */}
      {/* <ul role="list" className="space-y-4">
            {folders
              ? folders.map((folder) => {
                  return (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      teamInfo={teamInfo}
                      isDataroom={!!dataroomId}
                      dataroomId={dataroomId}
                    />
                  );
                })
              : Array.from({ length: 3 }).map((_, i) => (
                  <li
                    key={i}
                    className="relative flex w-full items-center space-x-3 rounded-lg border px-4 py-5 sm:px-6 lg:px-6"
                  >
                    <Skeleton key={i} className="h-9 w-9" />
                    <div>
                      <Skeleton key={i} className="h-4 w-32" />
                      <Skeleton key={i + 1} className="mt-2 h-3 w-12" />
                    </div>
                    <Skeleton
                      key={i + 1}
                      className="absolute right-5 top-[50%] h-5 w-20 -translate-y-[50%] transform"
                    />
                  </li>
                ))}
          </ul> */}

      {/* Documents list */}
      {/* <ul role="list" className="space-y-4">
            {documents
              ? documents.map((document) => {
                  if (dataroomId) {
                    return (
                      <DataroomDocumentCard
                        key={document.id}
                        document={document as DataroomFolderDocument}
                        teamInfo={teamInfo}
                        dataroomId={dataroomId}
                      />
                    );
                  } else {
                    return (
                      <DocumentCard
                        key={document.id}
                        document={
                          document as DocumentWithLinksAndLinkCountAndViewCount
                        }
                        teamInfo={teamInfo}
                      />
                    );
                  }
                })
              : Array.from({ length: 3 }).map((_, i) => (
                  <li
                    key={i}
                    className="relative flex w-full items-center space-x-3 rounded-lg border px-4 py-5 sm:px-6 lg:px-6"
                  >
                    <Skeleton key={i} className="h-9 w-9" />
                    <div>
                      <Skeleton key={i} className="h-4 w-32" />
                      <Skeleton key={i + 1} className="mt-2 h-3 w-12" />
                    </div>
                    <Skeleton
                      key={i + 1}
                      className="absolute right-5 top-[50%] h-5 w-20 -translate-y-[50%] transform"
                    />
                  </li>
                ))}
          </ul> */}

      {/* </div> */}
    </div>
  );
}
