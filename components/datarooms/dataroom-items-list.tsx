import { memo, useCallback, useState } from "react";

import { TeamContextType } from "@/context/team-context";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MeasuringStrategy,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import { FileIcon, FolderIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import { EmptyDocuments } from "@/components/documents/empty-document";
import FolderCard from "@/components/documents/folder-card";
import { UploadNotificationDrawer } from "@/components/upload-notification";
import UploadZone from "@/components/upload-zone";

import {
  DataroomFolderDocument,
  DataroomFolderWithCount,
} from "@/lib/swr/use-dataroom";

import { DraggableItem } from "../documents/drag-and-drop/draggable-item";
import { DroppableFolder } from "../documents/drag-and-drop/droppable-folder";
import { Button } from "../ui/button";
import { Portal } from "../ui/portal";
import DataroomDocumentCard from "./dataroom-document-card";

type FolderOrDocument =
  | (DataroomFolderWithCount & { itemType: "folder" })
  | (DataroomFolderDocument & { itemType: "document" });

export function DataroomItemsList({
  mixedItems,
  teamInfo,
  folderPathName,
  dataroomId,
  folderCount,
  documentCount,
}: {
  mixedItems: FolderOrDocument[] | [];
  teamInfo: TeamContextType | null;
  folderPathName?: string[];
  dataroomId: string;
  folderCount: number;
  documentCount: number;
}) {
  const [uploads, setUploads] = useState<
    { fileName: string; progress: number; documentId?: string }[]
  >([]);
  const [rejectedFiles, setRejectedFiles] = useState<
    { fileName: string; message: string }[]
  >([]);

  const [showDrawer, setShowDrawer] = useState(false);

  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [draggedDocumentName, setDraggedDocumentName] = useState<string | null>(
    null,
  );
  const [isOverFolder, setIsOverFolder] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id],
    );
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    // Set draggedDocumentName for DragOverlay
    if (event.active.data.current?.type === "document") {
      setDraggedDocumentName(event.active.data.current.name);
    }
    const documentId = event.active.id as string;
    // Find the index of the document that's being dragged
    const documentIndex = mixedItems
      .filter((item) => item.itemType === "document")
      .findIndex((doc) => doc.id === documentId);

    // Determine if the document is already selected
    const isSelected = selectedDocuments.includes(documentId);

    // Calculate yOffset only if the task is already selected
    // let yOffset = 0;
    // if (isSelected) {
    //   const firstSelectedIndex = documents?.findIndex((document) =>
    //     selectedDocuments.includes(document.id.toString()),
    //   );
    //   yOffset = (documentIndex - firstSelectedIndex) * 80; // Example task height, adjust accordingly
    // }

    // setDragOffset({ x: 0, y: yOffset });

    // Select the document if it's not already selected
    if (!isSelected) {
      setSelectedDocuments([documentId]);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;

    if (!over) return;

    const overType = over.data.current?.type;
    if (overType === "folder") {
      setIsOverFolder(true);
    } else {
      setIsOverFolder(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    const { active, over } = event;

    setDraggedDocumentName(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    const isActiveADocument = active.data.current?.type === "document";
    const isOverAFolder = over.data.current?.type === "folder";

    if (activeId === overId) return;
    if (!isActiveADocument || !isOverAFolder) return;

    // Move the document(s) to the new folder
    const documentsToMove =
      selectedDocuments.length > 0 ? selectedDocuments : [activeId.toString()];
    moveDocumentToFolder(documentsToMove, overId.toString());

    setSelectedDocuments([]);
    setIsOverFolder(false);
  };

  const moveDocumentToFolder = async (
    documentIds: string[],
    folderId: string,
  ) => {
    console.log("moving documents to folder", documentIds, folderId);
    const key = `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}${folderPathName ? `/folders/documents/${folderPathName.join("/")}` : "/documents"}`;
    // Optimistically update the UI by removing the documents from current folder
    mutate(
      key,
      (documents: any[] | undefined) => {
        if (!documents) return documents;

        // Filter out the documents that are being moved
        const updatedDocuments = documents.filter(
          (doc) => !documentIds.includes(doc.id),
        );

        // Return the updated list of documents
        return updatedDocuments;
      },
      false,
    );

    try {
      // Make the API call to move the document
      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/documents/move`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentIds, folderId }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to move document");
      }

      const { updatedCount } = await response.json();

      // Update local data using SWR's mutate
      mutate(key);
      toast.success(
        `${updatedCount} Document${updatedCount > 1 ? "s" : ""} moved successfully`,
      );
    } catch (error) {
      toast.error("Failed to move documents");
      // Revert the UI back to the previous state
      mutate(key);
    }
  };

  const renderItem = (item: FolderOrDocument) => {
    const itemId = `${item.itemType}-${item.id}`;

    return (
      <>
        {item.itemType === "folder" ? (
          <DroppableFolder key={itemId} id={item.id}>
            <FolderCard
              folder={item}
              teamInfo={teamInfo}
              isDataroom={!!dataroomId}
              dataroomId={dataroomId}
            />
          </DroppableFolder>
        ) : (
          <DraggableItem
            key={itemId}
            id={item.id}
            isSelected={selectedDocuments.includes(item.id)}
            onSelect={handleSelect}
            isDraggingSelected={isDragging}
          >
            <DataroomDocumentCard
              document={item as DataroomFolderDocument}
              teamInfo={teamInfo}
              dataroomId={dataroomId}
            />
          </DraggableItem>
        )}
      </>
    );
  };

  const HeaderContent = memo(() => {
    if (selectedDocuments.length > 0) {
      return (
        <div className="mb-2 flex items-center gap-x-2">
          <p className="flex items-center gap-x-1 text-sm text-gray-400">
            <Button
              onClick={() => setSelectedDocuments([])}
              className="size-5 rounded-full p-0.5"
              variant="ghost"
              size="icon"
            >
              <XIcon className="h-4 w-4" />
            </Button>
            <span>
              {selectedDocuments.length} document
              {selectedDocuments.length > 1 ? "s" : ""} selected
            </span>
          </p>
        </div>
      );
    } else {
      return (
        <div className="mb-2 flex items-center gap-x-2">
          {folderCount > 0 ? (
            <p className="flex items-center gap-x-1 text-sm text-gray-400">
              <FolderIcon className="h-4 w-4" />
              <span>{folderCount} folders</span>
            </p>
          ) : null}
          {documentCount > 0 ? (
            <p className="flex items-center gap-x-1 text-sm text-gray-400">
              <FileIcon className="h-4 w-4" />
              <span>{documentCount} documents</span>
            </p>
          ) : null}
        </div>
      );
    }
  });
  HeaderContent.displayName = "HeaderContent";

  return (
    <>
      <UploadZone
        folderPathName={folderPathName?.join("/")}
        onUploadStart={(newUploads) => {
          setUploads(newUploads);
          setShowDrawer(true);
        }}
        onUploadProgress={(index, progress, documentId) => {
          setUploads((prevUploads) =>
            prevUploads.map((upload, i) =>
              i === index ? { ...upload, progress, documentId } : upload,
            ),
          );
        }}
        onUploadRejected={(rejected) => {
          setRejectedFiles(rejected);
          setShowDrawer(true);
        }}
        setUploads={setUploads}
        setRejectedFiles={setRejectedFiles}
        dataroomId={dataroomId}
      >
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setIsOverFolder(false)}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always,
            },
          }}
        >
          <ul role="list" className="space-y-4">
            {mixedItems.map(renderItem)}
          </ul>

          <Portal>
            <DragOverlay className="cursor-default">
              <motion.div
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 0.5, opacity: 1 }}
                exit={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="relative flex h-20 w-40 items-center justify-center rounded-lg bg-gray-200"
              >
                <div className="h-20 w-40 rounded-lg bg-white text-foreground dark:bg-secondary">
                  {draggedDocumentName}
                </div>
                {selectedDocuments.length > 1 ? (
                  <div className="absolute right-0 top-0 rounded-full bg-white p-1 ring ring-gray-500">
                    <span className="text-xs font-semibold text-gray-500">
                      {selectedDocuments.length}
                    </span>
                  </div>
                ) : null}
              </motion.div>
            </DragOverlay>
          </Portal>

          <Portal containerId={"documents-header-count"}>
            <HeaderContent />
          </Portal>

          {mixedItems.length === 0 && (
            <div className="flex h-full justify-center">
              <EmptyDocuments />
            </div>
          )}
        </DndContext>
      </UploadZone>
      {showDrawer ? (
        <UploadNotificationDrawer
          open={showDrawer}
          onOpenChange={setShowDrawer}
          uploads={uploads}
          setUploads={setUploads}
          rejectedFiles={rejectedFiles}
          setRejectedFiles={setRejectedFiles}
        />
      ) : null}
    </>
  );
}
