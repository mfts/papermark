import { Brand, Dataroom, DataroomBrand, DataroomFolder } from "@prisma/client";
import Nav from "./nav";
import { Button } from "../ui/button";
import FolderCard from "./dataroom/folder-card";
import DocumentCard from "./dataroom/document-card";
import { useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import Link from "next/link";
import DataroomNav from "./dataroom/nav-dataroom";
import { FileTree } from "../ui/nextra-filetree";
import { ViewFolderTree } from "../datarooms/folders";
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetOverlay,
  SheetPortal,
  SheetTrigger,
} from "../ui/sheet";
import { MenuIcon, PanelLeftIcon, XIcon } from "lucide-react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

type DataroomDocument = {
  dataroomDocumentId: string;
  folderId: string | null;
  id: string;
  name: string;
  versions: {
    id: string;
    type: string;
    versionNumber: number;
    hasPages: boolean;
  }[];
};

export default function DataroomViewer({
  brand,
  viewId,
  dataroomViewId,
  dataroom,
  setViewType,
  setDocumentData,
}: {
  brand: DataroomBrand;
  viewId: string;
  dataroomViewId: string;
  dataroom: any;
  setViewType: React.Dispatch<
    React.SetStateAction<"DOCUMENT_VIEW" | "DATAROOM_VIEW">
  >;
  setDocumentData: React.Dispatch<
    React.SetStateAction<{
      id: string;
      name: string;
      hasPages: boolean;
      documentType: "pdf" | "notion";
      documentVersionId: string;
      documentVersionNumber: number;
    } | null>
  >;
}) {
  const [folderId, setFolderId] = useState<string | null>(null);
  const { documents, folders } = dataroom as {
    documents: DataroomDocument[];
    folders: DataroomFolder[];
  };

  console.log("dataroom", dataroom);
  return (
    <>
      <DataroomNav brand={brand} viewId={viewId} dataroom={dataroom} />
      <div
        style={{ height: "calc(100vh - 64px)" }}
        className="flex items-center relative bg-white dark:bg-black"
      >
        <div className="flex items-start justify-center mx-auto relative h-full w-full">
          {/* Tree view */}
          <div className="hidden md:flex h-full overflow-auto md:mx-5 lg:mx-7 xl:mx-10 mt-4 md:mt-5 lg:mt-8 mb-10 space-y-8 py-3 w-1/4 ">
            <ViewFolderTree
              folders={folders}
              documents={documents}
              setFolderId={setFolderId}
              folderId={folderId}
            />
          </div>

          {/* Detail view */}
          <ScrollArea className="flex-grow h-full" showScrollbar>
            <div className="md:mx-5 lg:mx-7 xl:mx-10 mt-4 md:mt-5 lg:mt-8 mb-10 space-y-8 p-3">
              <div className="flex items-center gap-x-2">
                {/* sidebar for mobile */}
                <div className="flex md:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <button className="text-muted-foreground lg:hidden hover:text-black">
                        <PanelLeftIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </SheetTrigger>
                    <SheetPortal>
                      <SheetOverlay className="fixed top-[35dvh] z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                      <SheetPrimitive.Content
                        className={cn(
                          "fixed top-[35dvh] z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
                          "left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-lg",
                          "w-[280px] sm:w-[300px] lg:hidden p-0 m-0",
                        )}
                      >
                        <div className="h-full overflow-auto mt-8 space-y-8 py-3 px-2">
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
                    {/* <SheetContent
                side="left"
                className="w-[280px] sm:w-[300px] lg:hidden p-0 m-0 top-56"
              >
                <div className="h-full overflow-auto md:mx-5 lg:mx-7 xl:mx-10 mt-4 md:mt-5 lg:mt-8 mb-10 space-y-8 py-3 px-2">
                  <ViewFolderTree
                    folders={folders}
                    documents={documents}
                    setFolderId={setFolderId}
                    folderId={folderId}
                  />
                </div>
              </SheetContent> */}
                  </Sheet>
                </div>

                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem key={"root"}>
                      <BreadcrumbLink asChild>
                        <BreadcrumbLink onClick={() => setFolderId(null)}>
                          Home
                        </BreadcrumbLink>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {folders &&
                      folders
                        .filter((folder) => folder.id === folderId)
                        .map((folder, index: number, array) => {
                          console.log("folder", folder);
                          return (
                            <React.Fragment key={index}>
                              <BreadcrumbSeparator />
                              <BreadcrumbItem>
                                <BreadcrumbPage className="capitalize">
                                  {folder.name}
                                </BreadcrumbPage>
                              </BreadcrumbItem>
                            </React.Fragment>
                          );
                        })}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <div className="space-y-4">
                {/* Folders list */}
                <ul role="list" className="space-y-4">
                  {folders
                    ? folders
                        .filter((folder) => folder.parentId === folderId)
                        .map((folder) => {
                          return (
                            <FolderCard
                              key={folder.id}
                              folder={folder}
                              dataroomId={dataroom?.id}
                              setFolderId={setFolderId}
                            />
                          );
                        })
                    : null}
                </ul>

                {/* Documents list */}
                <ul role="list" className="space-y-4">
                  {documents
                    ? documents
                        .filter((doc) => doc.folderId === folderId)
                        .map((document: DataroomDocument) => {
                          return (
                            <DocumentCard
                              key={document.id}
                              document={document}
                              setViewType={setViewType}
                              setDocumentData={setDocumentData}
                            />
                          );
                        })
                    : null}
                </ul>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}
