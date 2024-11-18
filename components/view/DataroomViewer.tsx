import { useMemo, useState } from "react";
import React from "react";

import { DataroomBrand, DataroomFolder } from "@prisma/client";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { PanelLeftIcon, XIcon } from "lucide-react";

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

import { cn } from "@/lib/utils";

import { TDocumentData } from "./dataroom/dataroom-view";
import DocumentCard from "./dataroom/document-card";
import FolderCard from "./dataroom/folder-card";
import DataroomNav from "./dataroom/nav-dataroom";

type FolderOrDocument = DataroomFolder | DataroomDocument;

type DataroomDocument = {
  dataroomDocumentId: string;
  folderId: string | null;
  id: string;
  name: string;
  orderIndex: number | null;
  downloadOnly: boolean;
  versions: {
    id: string;
    type: string;
    versionNumber: number;
    hasPages: boolean;
    isVertical: boolean;
  }[];
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
  dataroomViewId,
  dataroom,
  allowDownload,
  setViewType,
  setDocumentData,
  setDataroomVerified,
  isPreview,
  folderId,
  setFolderId,
}: {
  brand: Partial<DataroomBrand>;
  viewId?: string;
  linkId: string;
  dataroomViewId: string;
  dataroom: any;
  allowDownload: boolean;
  setViewType: React.Dispatch<
    React.SetStateAction<"DOCUMENT_VIEW" | "DATAROOM_VIEW">
  >;
  setDocumentData: React.Dispatch<React.SetStateAction<TDocumentData | null>>;
  setDataroomVerified: React.Dispatch<React.SetStateAction<boolean>>;
  isPreview?: boolean;
  folderId: string | null;
  setFolderId: React.Dispatch<React.SetStateAction<string | null>>;
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
        .map((doc) => ({ ...doc, itemType: "document" })),
    ];

    return mixedItems.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }, [folders, documents, folderId]);

  const renderItem = (item: FolderOrDocument) => {
    if ("versions" in item) {
      return (
        <DocumentCard
          key={item.id}
          document={item}
          setViewType={setViewType}
          setDocumentData={setDocumentData}
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
            <div className="h-full space-y-8 px-3 pb-4 pt-4 md:px-6 md:pt-6 lg:px-8 lg:pt-9 xl:px-14">
              <div className="flex items-center gap-x-2">
                {/* sidebar for mobile */}
                <div className="flex md:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <button className="text-muted-foreground hover:text-white lg:hidden">
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
              </div>
              <ul role="list" className="space-y-4 overflow-auto p-4">
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
