import { useSearchParams } from "next/navigation";

import React, { useEffect, useMemo, useState } from "react";

import { ChatProvider, useChatContext } from "@/context/chat-context";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  DataroomBrand,
  DataroomFolder,
  PermissionGroupAccessControls,
  ViewerGroupAccessControls,
} from "@prisma/client";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { ArrowLeftIcon, PanelLeftIcon, PlusIcon, X, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { sortByIndexThenName } from "@/lib/utils/sort-items-by-index-name";

import { DraggableCard } from "@/components/chat/draggable-card";
import { DraggablePill } from "@/components/chat/draggable-pill";
import { RAGChatInterface } from "@/components/chat/rag-chat-interface";
import { ViewFolderTree } from "@/components/datarooms/folders";
import { SearchBoxPersisted } from "@/components/search-box";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetOverlay,
  SheetPortal,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ButtonTooltip,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { ChatToggleButton } from "../../chat/chat-toggle-button";
import { DEFAULT_DATAROOM_VIEW_TYPE } from "../dataroom/dataroom-view";
import DocumentCard from "../dataroom/document-card";
import { DocumentUploadModal } from "../dataroom/document-upload-modal";
import FolderCard from "../dataroom/folder-card";
import IndexFileDialog from "../dataroom/index-file-dialog";
import DataroomNav from "../dataroom/nav-dataroom";

type FolderOrDocument =
  | (DataroomFolder & { allowDownload: boolean })
  | DataroomDocument;

export type DocumentVersion = {
  id: string;
  type: string;
  versionNumber: number;
  hasPages: boolean;
  isVertical: boolean;
  updatedAt: Date;
};

type DataroomDocument = {
  dataroomDocumentId: string;
  folderId: string | null;
  id: string;
  name: string;
  orderIndex: number | null;
  downloadOnly: boolean;
  versions: DocumentVersion[];
  canDownload: boolean;
  canView: boolean;
};

const getParentFolders = (
  folderId: string | null,
  folders: DataroomFolder[],
): DataroomFolder[] => {
  const breadcrumbFolders: DataroomFolder[] = [];
  let currentFolder = folders.find((folder) => folder.id === folderId);

  while (currentFolder) {
    breadcrumbFolders.unshift(currentFolder);
    currentFolder = folders.find(
      (folder) => folder.id === currentFolder!.parentId,
    );
  }

  return breadcrumbFolders;
};

export default function DataroomViewer({
  brand,
  viewId,
  linkId,
  dataroom,
  allowDownload,
  isPreview,
  folderId,
  setFolderId,
  accessControls,
  viewerId,
  viewData,
  enableIndexFile,
  isEmbedded,
  viewerEmail,
}: {
  brand: Partial<DataroomBrand>;
  viewId?: string;
  linkId: string;
  dataroom: any;
  allowDownload: boolean;
  isPreview?: boolean;
  folderId: string | null;
  setFolderId: React.Dispatch<React.SetStateAction<string | null>>;
  accessControls: ViewerGroupAccessControls[] | PermissionGroupAccessControls[];
  viewerId?: string;
  viewData: DEFAULT_DATAROOM_VIEW_TYPE;
  enableIndexFile?: boolean;
  isEmbedded?: boolean;
  viewerEmail?: string;
}) {
  const { documents, folders, allowBulkDownload } = dataroom as {
    documents: DataroomDocument[];
    folders: DataroomFolder[];
    allowBulkDownload: boolean;
  };

  const searchParams = useSearchParams();
  const searchQuery = searchParams?.get("search")?.toLowerCase() || "";
  const [showChat, setShowChat] = useState<boolean>(false);
  const [chatViewMode, setChatViewMode] = useState<"chat" | "history">("chat");
  const [chatTitle, setChatTitle] = useState<string>("Document Assistant");
  const [chatKey, setChatKey] = useState<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const [activeDragItem, setActiveDragItem] = useState<{
    type: "document" | "folder";
    name: string;
  } | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const dragData = active.data.current;

    if (
      dragData &&
      (dragData.type === "document" || dragData.type === "folder")
    ) {
      setActiveDragItem({
        type: dragData.type,
        name: dragData.name,
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === "chat-input-drop-zone") {
      const dragData = active.data.current;

      if (
        dragData &&
        (dragData.type === "document" || dragData.type === "folder")
      ) {
        const dropEvent = new CustomEvent("document-drop", {
          detail: {
            id: dragData.id,
            type: dragData.type,
            name: dragData.name,
          },
        });
        window.dispatchEvent(dropEvent);
      }
    }
    setActiveDragItem(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + L → Open Chat
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setShowChat(true);
        return;
      }

      // Escape → Close chat
      if (e.key === "Escape" && showChat) {
        e.preventDefault();
        setShowChat(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showChat]);

  const breadcrumbFolders = useMemo(
    () => getParentFolders(folderId, folders),
    [folderId, folders],
  );

  const allDocumentsCanDownload = useMemo(() => {
    if (!allowDownload) return false;
    if (!documents || documents.length === 0) return false;

    return documents.some((doc) => {
      if (doc.versions[0].type === "notion") return false;
      const accessControl = accessControls.find(
        (access) => access.itemId === doc.dataroomDocumentId,
      );
      return accessControl?.canDownload ?? true;
    });
  }, [documents, accessControls, allowDownload]);

  const folderEffectiveUpdatedAt = useMemo(() => {
    const effectiveUpdatedAt = new Map<string, Date>();
    const folderChildren = new Map<string, string[]>();
    const folderDocuments = new Map<string, DataroomDocument[]>();
    folders.forEach((folder) => {
      const parentId = folder.parentId || "root";
      if (!folderChildren.has(parentId)) {
        folderChildren.set(parentId, []);
      }
      folderChildren.get(parentId)!.push(folder.id);
    });

    // Build document map
    documents.forEach((doc) => {
      const folderId = doc.folderId || "root";
      if (!folderDocuments.has(folderId)) {
        folderDocuments.set(folderId, []);
      }
      folderDocuments.get(folderId)!.push(doc);
    });

    // Calculate effective updatedAt bottom-up (post-order traversal)
    const calculateEffectiveUpdatedAt = (folderId: string): Date => {
      // Return cached result if already calculated
      if (effectiveUpdatedAt.has(folderId)) {
        return effectiveUpdatedAt.get(folderId)!;
      }

      const folder = folders.find((f) => f.id === folderId);
      if (!folder) return new Date(0);

      let maxDate = new Date(folder.updatedAt);

      // Check documents in this folder
      const docsInFolder = folderDocuments.get(folderId) || [];
      docsInFolder.forEach((doc) => {
        if (doc.versions && doc.versions.length > 0) {
          const docDate = new Date(doc.versions[0].updatedAt);
          if (docDate > maxDate) maxDate = docDate;
        }
      });

      // Check child folders recursively
      const childFolderIds = folderChildren.get(folderId) || [];
      childFolderIds.forEach((childId) => {
        const childDate = calculateEffectiveUpdatedAt(childId);
        if (childDate > maxDate) maxDate = childDate;
      });

      // Cache and return result
      effectiveUpdatedAt.set(folderId, maxDate);
      return maxDate;
    };

    // Calculate for all folders
    folders.forEach((folder) => {
      calculateEffectiveUpdatedAt(folder.id);
    });

    return effectiveUpdatedAt;
  }, [folders, documents]);

  const mixedItems = useMemo(() => {
    if (searchQuery) {
      return (documents || [])
        .filter((doc) => doc.name.toLowerCase().includes(searchQuery))
        .map((doc) => {
          const accessControl = accessControls.find(
            (access) => access.itemId === doc.dataroomDocumentId,
          );

          return {
            ...doc,
            itemType: "document",
            canDownload:
              (accessControl?.canDownload ?? true) &&
              doc.versions[0].type !== "notion",
          };
        })
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    }

    const mixedItems: FolderOrDocument[] = [
      ...(folders || [])
        .filter((folder) => folder.parentId === folderId)
        .map((folder) => {
          const folderDocuments = documents.filter(
            (doc) => doc.folderId === folder.id,
          );

          const effectiveUpdatedAt =
            folderEffectiveUpdatedAt.get(folder.id) ||
            new Date(folder.updatedAt);

          const allDocumentsCanDownload =
            folderDocuments.length === 0 ||
            folderDocuments.every((doc) => {
              const accessControl = accessControls.find(
                (access) => access.itemId === doc.dataroomDocumentId,
              );
              return (
                (accessControl?.canDownload ?? true) &&
                doc.versions[0].type !== "notion"
              );
            });

          return {
            ...folder,
            updatedAt: effectiveUpdatedAt,
            itemType: "folder",
            allowDownload: allowDownload && allDocumentsCanDownload,
          };
        }),
      ...(documents || [])
        .filter((doc) => doc.folderId === folderId)
        .map((doc) => {
          const accessControl = accessControls.find(
            (access) => access.itemId === doc.dataroomDocumentId,
          );

          return {
            ...doc,
            itemType: "document",
            canDownload:
              (accessControl?.canDownload ?? true) &&
              doc.versions[0].type !== "notion",
          };
        }),
    ];

    return sortByIndexThenName(mixedItems);
  }, [
    folders,
    documents,
    folderId,
    accessControls,
    allowDownload,
    folderEffectiveUpdatedAt,
    searchQuery,
  ]);

  const renderItem = (item: FolderOrDocument) => {
    if ("versions" in item) {
      const isProcessing =
        ["docs", "slides", "pdf"].includes(item.versions[0].type) &&
        !item.versions[0].hasPages;

      return (
        <DraggableCard
          key={item.id}
          id={item.id}
          type="document"
          name={item.name}
        >
          <DocumentCard
            document={item}
            linkId={linkId}
            viewId={viewId}
            isPreview={!!isPreview}
            allowDownload={allowDownload && item.canDownload}
            isProcessing={isProcessing}
          />
        </DraggableCard>
      );
    }

    return (
      <DraggableCard key={item.id} id={item.id} type="folder" name={item.name}>
        <FolderCard
          folder={item}
          dataroomId={dataroom?.id}
          setFolderId={setFolderId}
          isPreview={!!isPreview}
          linkId={linkId}
          viewId={viewId}
          allowDownload={item.allowDownload}
        />
      </DraggableCard>
    );
  };

  const DataroomContent = () => (
    <div className="relative mx-auto flex h-full w-full items-start justify-center">
      <div className="hidden h-full w-1/4 space-y-8 overflow-auto px-3 pb-4 pt-4 md:flex md:px-6 md:pt-6 lg:px-8 lg:pt-9 xl:px-14">
        <ScrollArea showScrollbar className="w-full">
          <ViewFolderTree
            folders={folders}
            documents={documents}
            setFolderId={setFolderId}
            folderId={folderId}
          />
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>

      {/* Detail view */}
      <ScrollArea showScrollbar className="h-full flex-grow overflow-auto">
        <div className="h-full px-3 pb-4 pt-4 md:px-6 md:pt-6 lg:px-8 lg:pt-9 xl:px-14">
          <div className="flex items-center gap-x-2">
            {/* sidebar for mobile */}
            <div className="flex md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="text-muted-foreground lg:hidden">
                    <PanelLeftIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </SheetTrigger>
                <SheetPortal>
                  <SheetOverlay className="fixed top-[35dvh] z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                  <SheetPrimitive.Content
                    className={cn(
                      "fixed top-[35dvh] z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
                      "left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-lg",
                      "m-0 w-[280px] p-0 sm:w-[300px] lg:hidden",
                    )}
                  >
                    <div className="mt-8 h-full space-y-8 overflow-auto px-2 py-3">
                      <ViewFolderTree
                        folders={folders}
                        documents={documents}
                        setFolderId={setFolderId}
                        folderId={folderId}
                      />
                    </div>
                    <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                      <XIcon className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </SheetPrimitive.Close>
                  </SheetPrimitive.Content>
                </SheetPortal>
              </Sheet>
            </div>

            <div className="flex flex-1 items-center justify-between gap-x-2">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem key={"root"}>
                    <BreadcrumbLink
                      onClick={() => setFolderId(null)}
                      className="cursor-pointer"
                    >
                      Home
                    </BreadcrumbLink>
                  </BreadcrumbItem>

                  {breadcrumbFolders.map((folder, index) => (
                    <React.Fragment key={folder.id}>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        {index === breadcrumbFolders.length - 1 ? (
                          <BreadcrumbPage className="capitalize">
                            {folder.name}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink
                            onClick={() => setFolderId(folder.id)}
                            className="cursor-pointer capitalize"
                          >
                            {folder.name}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>

              <div className="flex items-center gap-x-2">
                <SearchBoxPersisted inputClassName="h-9" />

                {dataroom?.id && viewerId && linkId && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ChatToggleButton
                        isOpen={showChat}
                        onToggle={() => setShowChat(!showChat)}
                        className="h-9 w-9 bg-gray-900 text-white hover:bg-gray-900/80"
                      />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>AI Assistant </p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {enableIndexFile && viewId && viewerId && (
                  <IndexFileDialog
                    linkId={linkId}
                    viewId={viewId}
                    dataroomId={dataroom?.id}
                    viewerId={viewerId}
                    viewerEmail={viewerEmail}
                  />
                )}

                {viewData?.enableVisitorUpload && viewerId && (
                  <DocumentUploadModal
                    linkId={linkId}
                    dataroomId={dataroom?.id}
                    viewerId={viewerId}
                    folderId={folderId ?? undefined}
                  />
                )}
              </div>
            </div>
          </div>

          {searchQuery && (
            <div className="mt-4 rounded-md border border-muted/50 bg-muted px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Search results for &quot;{searchQuery}&quot;
                </div>
                <div className="text-xs text-muted-foreground">
                  ({mixedItems.length} result
                  {mixedItems.length !== 1 ? "s" : ""} across all folders)
                </div>
              </div>
            </div>
          )}

          <ul role="list" className="-mx-4 space-y-4 overflow-auto p-4">
            {mixedItems.length === 0 ? (
              <li className="py-6 text-center text-muted-foreground">
                {searchQuery
                  ? "No documents match your search."
                  : "No items available."}
              </li>
            ) : (
              mixedItems.map((item) => (
                <li key={item.id}>{renderItem(item)}</li>
              ))
            )}
          </ul>
        </div>
        <ScrollBar orientation="vertical" />
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );

  const handleCreateSession = () => {
    if (chatViewMode !== "chat" || chatTitle !== "Document Assistant") {
      setChatViewMode("chat");
      setChatTitle("Document Assistant");
      setChatKey((prev) => prev + 1);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <DataroomNav
        brand={brand}
        linkId={linkId}
        viewId={viewId}
        dataroom={dataroom}
        allowDownload={allDocumentsCanDownload}
        allowBulkDownload={allowBulkDownload}
        isPreview={isPreview}
        dataroomId={dataroom?.id}
        viewerId={viewerId}
        conversationsEnabled={viewData.conversationsEnabled}
        isTeamMember={viewData.isTeamMember}
      />
      <div className="h-dvh w-full">
        {!showChat ? (
          <div className="relative flex h-full items-center bg-white dark:bg-black">
            <DataroomContent />
          </div>
        ) : (
          <ResizablePanelGroup
            direction="horizontal"
            className="bg-white dark:bg-black"
          >
            <ResizablePanel defaultSize={65} minSize={40}>
              <DataroomContent />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={35} minSize={25} maxSize={60}>
              <div className="flex h-full flex-col border-l bg-background">
                <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {chatViewMode === "chat" && (
                      <ButtonTooltip content="Back to Chat History">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setChatViewMode("history");
                            setChatTitle("Chat History");
                          }}
                          className="h-8 w-8 flex-shrink-0 p-0"
                        >
                          <ArrowLeftIcon className="h-4 w-4" />
                        </Button>
                      </ButtonTooltip>
                    )}
                    <span className="truncate text-sm font-medium">
                      {chatTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ButtonTooltip content="Start New Chat">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCreateSession}
                        className="h-8 w-8 p-0"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </ButtonTooltip>
                    <ButtonTooltip content="Close Chat">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowChat(false)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </ButtonTooltip>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChatProvider key={chatKey}>
                    <ChatTitleUpdater setChatTitle={setChatTitle} />
                    <RAGChatInterface
                      dataroomId={dataroom?.id}
                      viewerId={viewerId ?? ""}
                      linkId={linkId}
                      documents={documents.map((doc) => ({
                        id: doc.id,
                        name: doc.name,
                        folderId: doc.folderId,
                      }))}
                      folders={folders.map((folder) => ({
                        id: folder.id,
                        name: folder.name,
                        parentId: folder.parentId,
                      }))}
                      viewMode={chatViewMode}
                      onViewModeChange={(mode: "chat" | "history") => {
                        setChatViewMode(mode);
                        setChatTitle(
                          mode === "chat"
                            ? "Document Assistant"
                            : "Chat History",
                        );
                      }}
                      onSessionChange={(sessionId: string | null) => {
                        if (sessionId) {
                          setChatTitle("Chat Session");
                        } else {
                          setChatTitle("Document Assistant");
                        }
                      }}
                    />
                  </ChatProvider>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeDragItem && (
          <DraggablePill
            id="drag-preview"
            type={activeDragItem.type}
            name={activeDragItem.name}
            className="shadow-lg"
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

function ChatTitleUpdater({
  setChatTitle,
}: {
  setChatTitle: (title: string) => void;
}) {
  const { currentSession } = useChatContext();

  useEffect(() => {
    if (currentSession) {
      setChatTitle(currentSession.title);
    } else {
      setChatTitle("Document Assistant");
    }
  }, [currentSession, setChatTitle]);

  return null;
}
