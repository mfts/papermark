import { useEffect, useState } from "react";
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

import DataroomDocumentCard from "@/components/datarooms/dataroom-document-card";
import FolderCard from "@/components/documents/folder-card";
import { Skeleton } from "@/components/ui/skeleton";

import {
  DataroomFolderDocument,
  DataroomFolderWithCount,
} from "@/lib/swr/use-dataroom";

import { ItemCategory, SortableItem } from "./sortable-item";

type FolderOrDocument = DataroomFolderWithCount | DataroomFolderDocument;

const isFolder = (item: FolderOrDocument): item is DataroomFolderWithCount =>
  "_count" in item && "childFolders" in item._count;

export function DataroomSortableList({
  folders,
  documents,
  teamInfo,
  dataroomId,
  onReorder,
}: {
  folders: DataroomFolderWithCount[] | undefined;
  documents: DataroomFolderDocument[] | undefined;
  teamInfo: TeamContextType | null;
  dataroomId: string;
  onReorder: (newOrder: { category: ItemCategory; id: string }[]) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState<FolderOrDocument[]>([
    ...(folders || []),
    ...(documents || []),
  ]);

  useEffect(() => {
    setItems([...(folders || []), ...(documents || [])]);
  }, [folders, documents]);

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
          (item) =>
            `${isFolder(item) ? "folder" : "document"}-${item.id}` === activeId,
        );
        const newIndex = prevItems.findIndex(
          (item) =>
            `${isFolder(item) ? "folder" : "document"}-${item.id}` === overId,
        );

        const newItems = arrayMove(prevItems, oldIndex, newIndex);
        // onReorder(
        //   newItems.map((item) => ({
        //     category: isFolder(item) ? "folder" : "document",
        //     id: item.id,
        //   })),
        // );
        console.log("reorder", newItems);

        return newItems;
      });
    }

    setActiveId(null);
  };

  const renderItem = (item: FolderOrDocument) => {
    const itemId = `${isFolder(item) ? "folder" : "document"}-${item.id}`;

    return (
      <SortableItem
        key={itemId}
        id={itemId}
        category={isFolder(item) ? "folder" : "document"}
      >
        {isFolder(item) ? (
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
    ? items.find(
        (item) =>
          `${isFolder(item) ? "folder" : "document"}-${item.id}` === activeId,
      )
    : null;

  return (
    <div className="rounded-lg border-2 border-dashed border-gray-400 p-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        <SortableContext
          items={items.map(
            (item) => `${isFolder(item) ? "folder" : "document"}-${item.id}`,
          )}
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
              {isFolder(activeItem) ? (
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
