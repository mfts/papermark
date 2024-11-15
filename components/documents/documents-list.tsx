import { memo, useCallback, useState } from "react";
import React from "react";

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
import {
  ArchiveIcon,
  FileIcon,
  FolderIcon,
  FolderInputIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { UploadNotificationDrawer } from "@/components/upload-notification";
import UploadZone from "@/components/upload-zone";

import { moveDocumentToFolder } from "@/lib/documents/move-documents";
import { FolderWithCount } from "@/lib/swr/use-documents";
import { DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";
import { useMediaQuery } from "@/lib/utils/use-media-query";

import { Button } from "../ui/button";
import { Portal } from "../ui/portal";
import { ButtonTooltip } from "../ui/tooltip";
import { useDeleteDocumentsModal } from "./actions/delete-documents-modal";
import DocumentCard from "./document-card";
import { DraggableItem } from "./drag-and-drop/draggable-item";
import { DroppableFolder } from "./drag-and-drop/droppable-folder";
import { EmptyDocuments } from "./empty-document";
import FolderCard from "./folder-card";
import { MoveToFolderModal } from "./move-folder-modal";
import Link from "next/link";
import { useRouter } from "next/router";

export function DocumentsList({
  folders,
  documents,
  teamInfo,
  folderPathName,
}: {
  folders: FolderWithCount[] | undefined;
  documents: DocumentWithLinksAndLinkCountAndViewCount[] | undefined;
  teamInfo: TeamContextType | null;
  folderPathName?: string[];
}) {
  const { isMobile } = useMediaQuery();
  const router = useRouter();

  const [uploads, setUploads] = useState<
    { fileName: string; progress: number; documentId?: string }[]
  >([]);
  const [rejectedFiles, setRejectedFiles] = useState<
    { fileName: string; message: string }[]
  >([]);

  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [moveFolderOpen, setMoveFolderOpen] = useState<boolean>(false);

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  const [draggedDocument, setDraggedDocument] =
    useState<DocumentWithLinksAndLinkCountAndViewCount | null>(null);
  const [isOverFolder, setIsOverFolder] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const { setShowDeleteDocumentsModal, DeleteDocumentsModal } =
    useDeleteDocumentsModal({
      documentIds: selectedDocuments,
      setSelectedDocuments: setSelectedDocuments,
    });

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
      setDraggedDocument(
        documents?.find((doc) => doc.id === event.active.id) ?? null,
      );
    }
    const documentId = event.active.id as string;
    // Find the index of the document that's being dragged
    const documentIndex = documents?.findIndex((doc) => doc.id === documentId);

    // Determine if the document is already selected
    const isSelected = selectedDocuments.includes(documentId);

    // Calculate yOffset only if the task is already selected
    let yOffset = 0;
    if (isSelected) {
      const firstSelectedIndex = documents?.findIndex((document) =>
        selectedDocuments.includes(document.id.toString()),
      );
      yOffset = (documentIndex! - firstSelectedIndex!) * 80; // Example task height, adjust accordingly
    }

    setDragOffset({ x: 0, y: yOffset });

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

    setDraggedDocument(null);

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
    moveDocumentToFolder({
      documentIds: documentsToMove,
      folderId: overId.toString(),
      folderPathName,
      teamId: teamInfo?.currentTeam?.id,
    });

    setSelectedDocuments([]);
    setIsOverFolder(false);
  };
  const endpoint = router.asPath.split('/').pop();
  const HeaderContent = memo(() => {
    if (selectedDocuments.length > 0) {
      return (
        <div className="mb-2 flex items-center gap-x-1 rounded-3xl bg-gray-100 text-sm text-foreground dark:bg-gray-800">
          <ButtonTooltip content="Clear selection">
            <Button
              onClick={() => setSelectedDocuments([])}
              className="mx-1.5 my-1 size-8 rounded-full hover:bg-gray-200 hover:dark:bg-gray-700"
              variant="ghost"
              size="icon"
            >
              <XIcon className="h-5 w-5" />
            </Button>
          </ButtonTooltip>
          <div className="mr-2 tabular-nums">
            {selectedDocuments.length} selected
          </div>
          <ButtonTooltip content="Move">
            <Button
              onClick={() => setMoveFolderOpen(true)}
              className="mx-1.5 my-1 size-8 rounded-full hover:bg-gray-200 hover:dark:bg-gray-700"
              variant="ghost"
              size="icon"
            >
              <FolderInputIcon className="h-5 w-5" />
            </Button>
          </ButtonTooltip>
          <ButtonTooltip content="Delete">
            <Button
              onClick={() => setShowDeleteDocumentsModal(true)}
              className="mx-1.5 my-1 size-8 rounded-full hover:bg-destructive hover:text-destructive-foreground"
              variant="ghost"
              size="icon"
            >
              <Trash2Icon className="h-5 w-5" />
            </Button>
          </ButtonTooltip>
        </div>
      );
    } else {
      return (
        <div className="mb-2 flex justify-between items-center gap-x-2 pt-5 relative">
          {folders && folders.length > 0 && (
            <p className="flex items-center gap-x-1 text-sm text-gray-400">
              <FolderIcon className="h-5 w-5" />
              <span>
                {folders.length} folder{folders.length > 1 ? "s" : ""}
              </span>
            </p>
          )}
          {documents && documents.length > 0 && (
            <p className="flex items-center gap-x-1 text-sm text-gray-400">
              <FileIcon className="h-5 w-5" />
              <span>
                {
                  documents.length
                }{" "}
                document{documents.length !== 1 ? "s" : ""}
    </span>
            </p>
          )}
          {
            endpoint == "documents" &&
            (
              <Link href="/documents/archive" className=" absolute right-0 flex items-center gap-2 px-3 py-2 text-sm mb-2">
            <ArchiveIcon className="h-5 w-5" />
             Archive
          </Link>
            )
          }
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
      >
        {isMobile ? (
          <div className="space-y-4">
            {/* Folders list */}
            <ul role="list" className="space-y-4">
              {folders
                ? folders.map((folder) => {
                    return (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        teamInfo={teamInfo}
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
            </ul>

            {/* Documents list */}
            <ul role="list" className="space-y-4">
              {documents
                ? documents.map((document) => {
                    return (
                      <DocumentCard
                        key={document.id}
                        document={document}
                        teamInfo={teamInfo}
                        isDragging={
                          isDragging && selectedDocuments.includes(document.id)
                        }
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
            </ul>

            <Portal containerId={"documents-header-count"}>
              <HeaderContent />
            </Portal>

            {documents && documents.length === 0 && (
               <div className="flex items-center justify-center">
                 <EmptyDocuments />
                </div>
            )}

          </div>
        ) : (
          <>
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
              <div className="space-y-4 pb-3">
                {/* Folders list */}
                <ul role="list" className="space-y-4">
                  {folders
                    ? folders.map((folder) => {
                        return (
                          <DroppableFolder key={folder.id} id={folder.id}>
                            <FolderCard
                              key={folder.id}
                              folder={folder}
                              teamInfo={teamInfo}
                            />
                          </DroppableFolder>
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
                </ul>

                {/* Documents list */}
                <ul role="list" className="space-y-4">
                  {documents
                    ? documents.map((document) => {
                        return (
                          <DraggableItem
                            key={document.id}
                            id={document.id}
                            isSelected={selectedDocuments.includes(document.id)}
                            onSelect={handleSelect}
                            isDraggingSelected={isDragging}
                          >
                            <DocumentCard
                              key={document.id}
                              document={document}
                              teamInfo={teamInfo}
                              isDragging={
                                isDragging &&
                                selectedDocuments.includes(document.id)
                              }
                            />
                          </DraggableItem>
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
                </ul>

                <Portal>
                  <DragOverlay className="cursor-default">
                    <motion.div
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 0.9, opacity: 0.95 }}
                      exit={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="relative"
                      style={{ transform: `translateY(${dragOffset.y}px)` }}
                    >
                      {draggedDocument ? (
                        <DocumentCard
                          document={draggedDocument}
                          teamInfo={teamInfo}
                        />
                      ) : null}
                      {selectedDocuments.length > 1 ? (
                        <div className="absolute -right-4 -top-4 rounded-full border border-border bg-foreground px-4 py-2">
                          <span className="text-sm font-semibold text-background">
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

                {documents && documents.length === 0 && (
                  <div className="flex items-center justify-center">
                    <EmptyDocuments />
                  </div>
                )}

              </div>
            </DndContext>
            {moveFolderOpen ? (
              <MoveToFolderModal
                open={moveFolderOpen}
                setOpen={setMoveFolderOpen}
                setSelectedDocuments={setSelectedDocuments}
                documentIds={selectedDocuments}
              />
            ) : null}
            <DeleteDocumentsModal />
          </>
        )}
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
