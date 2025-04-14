import { useMemo } from "react";
import React from "react";

import {
  DataroomBrand,
  DataroomFolder,
  ViewerGroupAccessControls,
} from "@prisma/client";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { PanelLeftIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { ViewFolderTree } from "@/components/datarooms/folders";
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
import DataroomNav from "../dataroom/nav-dataroom";

type FolderOrDocument = DataroomFolder | DataroomDocument;

export type DocumentVersion = {
  id: string;
  type: string;
  versionNumber: number;
  hasPages: boolean;
  isVertical: boolean;
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
}: {
  brand: Partial<DataroomBrand>;
  viewId?: string;
  linkId: string;
  dataroom: any;
  allowDownload: boolean;
  isPreview?: boolean;
  folderId: string | null;
  setFolderId: React.Dispatch<React.SetStateAction<string | null>>;
  accessControls: ViewerGroupAccessControls[];
  viewerId?: string;
  viewData: DEFAULT_DATAROOM_VIEW_TYPE;
}) {
  const { documents, folders } = dataroom as {
    documents: DataroomDocument[];
    folders: DataroomFolder[];
  };

  const breadcrumbFolders = useMemo(
    () => getParentFolders(folderId, folders),
    [folderId, folders],
  );

  // create a mixedItems array with folders and documents of the current folder and memoize it
  const mixedItems = useMemo(() => {
    const mixedItems: FolderOrDocument[] = [
      ...(folders || [])
        .filter((folder) => folder.parentId === folderId)
        .map((folder) => ({ ...folder, itemType: "folder" })),
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
    return mixedItems.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }, [folders, documents, folderId, accessControls]);

  const renderItem = (item: FolderOrDocument) => {
    if ("versions" in item) {
      return (
        <DocumentCard
          key={item.id}
          document={item}
          linkId={linkId}
          viewId={viewId}
          isPreview={!!isPreview}
          allowDownload={allowDownload}
        />
      );
    }

    return (
      <FolderCard
        key={item.id}
        folder={item}
        dataroomId={dataroom?.id}
        setFolderId={setFolderId}
      />
    );
  };

  return (
    <>
      <DataroomNav
        brand={brand}
        linkId={linkId}
        viewId={viewId}
        dataroom={dataroom}
        allowDownload={allowDownload}
        isPreview={isPreview}
        dataroomId={dataroom?.id}
        viewerId={viewerId}
        conversationsEnabled={viewData.conversationsEnabled}
      />
      <div
        style={{ height: "calc(100vh - 64px)" }}
        className="relative flex items-center bg-white dark:bg-black"
      >
        <div className="relative mx-auto flex h-full w-full items-start justify-center">
          {/* Tree view */}
          <div className="hidden h-full w-1/4 space-y-8 overflow-auto px-3 pb-4 pt-4 md:flex md:px-6 md:pt-6 lg:px-8 lg:pt-9 xl:px-14">
            <ScrollArea showScrollbar>
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
              <ul role="list" className="-mx-4 space-y-4 overflow-auto p-4">
                {mixedItems.map(renderItem)}
              </ul>
            </div>
            <ScrollBar orientation="vertical" />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    </>
  );
}
