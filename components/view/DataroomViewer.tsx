import {
  Brand,
  Dataroom,
  DataroomDocument,
  DataroomFolder,
} from "@prisma/client";
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
} from "../ui/breadcrumb";
import Link from "next/link";

type DataroomDocument = {
  dataroomDocumentId: string;
  folderId: string | null;
  id: string;
  name: string;
  versions: {
    id: string;
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
  brand: Brand;
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
  console.log("documents, ", documents);
  return (
    <>
      <Nav brand={brand} viewId={viewId} />
      <div
        style={{ height: "calc(100vh - 64px)" }}
        className="flex items-center relative bg-white dark:bg-black"
      >
        <div className="flex justify-center mx-auto relative h-full w-full">
          <ScrollArea className="flex-grow " showScrollbar>
            <div className="relative overflow-hidden mx-2 sm:mx-3 md:mx-5 lg:mx-7 xl:mx-10 mt-4 md:mt-5 lg:mt-8 mb-10 space-y-8 p-3 w-1/2">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem key={"root"}>
                    <BreadcrumbLink asChild>
                      <BreadcrumbLink onClick={() => setFolderId(null)}>
                        Home
                      </BreadcrumbLink>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
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
