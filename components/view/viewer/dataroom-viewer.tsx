import { useRouter } from "next/router";

import { useMemo } from "react";
import React from "react";

import { ViewerChatPanel } from "@/ee/features/ai/components/viewer-chat-panel";
import {
  ViewerChatLayout,
  ViewerChatProvider,
} from "@/ee/features/ai/components/viewer-chat-provider";
import { ViewerChatToggle } from "@/ee/features/ai/components/viewer-chat-toggle";
import {
  DataroomBrand,
  DataroomFolder,
  PermissionGroupAccessControls,
  ViewerGroupAccessControls,
} from "@prisma/client";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { PanelLeftIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  HIERARCHICAL_DISPLAY_STYLE,
  getHierarchicalDisplayName,
} from "@/lib/utils/hierarchical-display";
import { sortByIndexThenName } from "@/lib/utils/sort-items-by-index-name";

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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetOverlay,
  SheetPortal,
  SheetTrigger,
} from "@/components/ui/sheet";

import { DEFAULT_DATAROOM_VIEW_TYPE } from "../dataroom/dataroom-view";
import DocumentCard from "../dataroom/document-card";
import { DocumentUploadModal } from "../dataroom/document-upload-modal";
import FolderCard from "../dataroom/folder-card";
import IndexFileDialog from "../dataroom/index-file-dialog";
import {
  IntroductionInfoButton,
  IntroductionProvider,
} from "../dataroom/introduction-modal";
import DataroomNav from "../dataroom/nav-dataroom";

const ViewerBreadcrumbItem = ({
  folder,
  setFolderId,
  isLast,
  dataroomIndexEnabled,
}: {
  folder: any;
  setFolderId: (id: string | null) => void;
  isLast: boolean;
  dataroomIndexEnabled?: boolean;
}) => {
  const displayName = getHierarchicalDisplayName(
    folder.name,
    folder.hierarchicalIndex,
    dataroomIndexEnabled || false,
  );

  if (isLast) {
    return (
      <BreadcrumbPage className="capitalize" style={HIERARCHICAL_DISPLAY_STYLE}>
        {displayName}
      </BreadcrumbPage>
    );
  }

  return (
    <BreadcrumbLink
      onClick={() => setFolderId(folder.id)}
      className="cursor-pointer capitalize"
      style={HIERARCHICAL_DISPLAY_STYLE}
    >
      {displayName}
    </BreadcrumbLink>
  );
};

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
  hierarchicalIndex: string | null;
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
  dataroomIndexEnabled,
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
  dataroomIndexEnabled?: boolean;
}) {
  const { documents, folders, allowBulkDownload } = dataroom as {
    documents: DataroomDocument[];
    folders: DataroomFolder[];
    allowBulkDownload: boolean;
  };

  const router = useRouter();
  const searchQuery = (router.query.search as string)?.toLowerCase() || "";

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

  // Efficiently calculate effective updatedAt for all folders in a single pass
  const folderEffectiveUpdatedAt = useMemo(() => {
    const effectiveUpdatedAt = new Map<string, Date>();

    // Create maps for fast lookups
    const folderChildren = new Map<string, string[]>();
    const folderDocuments = new Map<string, DataroomDocument[]>();

    // Build folder hierarchy map
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

  // create a mixedItems array with folders and documents of the current folder and memoize it
  const mixedItems = useMemo(() => {
    // If there's a search query, filter documents by name across all folders
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

          // Get pre-calculated effective updatedAt
          const effectiveUpdatedAt =
            folderEffectiveUpdatedAt.get(folder.id) ||
            new Date(folder.updatedAt);

          const allDocumentsCanDownload =
            folderDocuments.length === 0 || // Allow download for empty folders
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
        <DocumentCard
          key={item.id}
          document={item}
          linkId={linkId}
          viewId={viewId}
          isPreview={!!isPreview}
          allowDownload={allowDownload && item.canDownload}
          isProcessing={isProcessing}
          dataroomIndexEnabled={dataroomIndexEnabled}
          showLastUpdated={dataroom?.showLastUpdated ?? true}
        />
      );
    }

    return (
      <FolderCard
        key={item.id}
        folder={item}
        dataroomId={dataroom?.id}
        setFolderId={setFolderId}
        isPreview={!!isPreview}
        linkId={linkId}
        viewId={viewId}
        allowDownload={item.allowDownload}
        dataroomIndexEnabled={dataroomIndexEnabled}
        showLastUpdated={dataroom?.showLastUpdated ?? true}
      />
    );
  };

  // Prepare documents for chat context
  const documentsForChat = documents.map((doc) => ({
    dataroomDocumentId: doc.dataroomDocumentId,
    id: doc.id,
    name: doc.name,
    folderId: doc.folderId,
  }));

  return (
    <IntroductionProvider dataroom={dataroom} viewerId={viewerId}>
      <ViewerChatProvider
        enabled={viewData.agentsEnabled}
        dataroomId={dataroom?.id}
        dataroomName={viewData.dataroomName}
        linkId={linkId}
        viewId={viewId}
        viewerId={viewerId}
        documents={documentsForChat}
        folders={folders}
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
        viewerEmail={viewerEmail}
        conversationsEnabled={viewData.conversationsEnabled}
        isTeamMember={viewData.isTeamMember}
      />
      <ViewerChatLayout>
        <div className="relative flex flex-1 items-center overflow-hidden bg-white dark:bg-black">
          <div className="relative mx-auto flex h-full w-full items-start justify-center">
            {/* Tree view */}
            <div className="hidden h-full w-1/4 space-y-8 overflow-auto px-3 pb-4 pt-4 md:flex md:px-6 md:pt-6 lg:px-8 lg:pt-9 xl:px-14">
              <ScrollArea showScrollbar className="w-full">
                <ViewFolderTree
                  folders={folders}
                  documents={documents}
                  setFolderId={setFolderId}
                  folderId={folderId}
                  dataroomIndexEnabled={dataroomIndexEnabled}
                />
                <ScrollBar orientation="horizontal" />
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            </div>

            {/* Detail view */}
            <ScrollArea
              showScrollbar
              className="h-full flex-grow overflow-auto"
            >
              <div className="h-full px-3 pb-4 pt-4 md:px-6 md:pt-6 lg:px-8 lg:pt-9 xl:px-14">
                <div className="flex items-center gap-x-2">
                  {/* sidebar for mobile */}
                  <div className="flex md:hidden">
                    <Sheet>
                      <SheetTrigger asChild>
                        <button className="text-muted-foreground lg:hidden">
                          <PanelLeftIcon
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
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
                              dataroomIndexEnabled={dataroomIndexEnabled}
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
                              <ViewerBreadcrumbItem
                                folder={folder}
                                setFolderId={setFolderId}
                                isLast={index === breadcrumbFolders.length - 1}
                                dataroomIndexEnabled={dataroomIndexEnabled}
                              />
                            </BreadcrumbItem>
                          </React.Fragment>
                        ))}
                      </BreadcrumbList>
                    </Breadcrumb>

                    <div className="flex items-center gap-x-2">
                      <IntroductionInfoButton />
                      <SearchBoxPersisted inputClassName="h-9" />
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

                {/* Search results banner */}
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
        </div>
      </ViewerChatLayout>

      {/* AI Chat Components */}
      <ViewerChatPanel />
      <ViewerChatToggle />
      </ViewerChatProvider>
    </IntroductionProvider>
  );
}
