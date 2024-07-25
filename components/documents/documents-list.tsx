import { useState } from "react";

import { TeamContextType } from "@/context/team-context";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadNotificationDrawer } from "@/components/upload-notification";
import UploadZone from "@/components/upload-zone";

import {
  DataroomFolderDocument,
  DataroomFolderWithCount,
} from "@/lib/swr/use-dataroom";
import { FolderWithCount } from "@/lib/swr/use-documents";
import { DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";

import DataroomDocumentCard from "../datarooms/dataroom-document-card";
import DocumentCard from "./document-card";
import { EmptyDocuments } from "./empty-document";
import FolderCard from "./folder-card";

export function DocumentsList({
  folders,
  documents,
  teamInfo,
  folderPathName,
  dataroomId,
}: {
  folders: FolderWithCount[] | DataroomFolderWithCount[] | undefined;
  documents:
    | DocumentWithLinksAndLinkCountAndViewCount[]
    | DataroomFolderDocument[]
    | undefined;
  teamInfo: TeamContextType | null;
  folderPathName?: string[];
  dataroomId?: string;
}) {
  const [uploads, setUploads] = useState<
    { fileName: string; progress: number; documentId?: string }[]
  >([]);
  const [rejectedFiles, setRejectedFiles] = useState<
    { fileName: string; message: string }[]
  >([]);

  const [showDrawer, setShowDrawer] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // function handleDragEnd(event: any) {
  //   const { active, over } = event;

  //   if (over && active.id !== over.id ) {
  //     const activeIndex = documents?.findIndex(
  //       (document) => document.id === active.id,
  //     );
  //     const overIndex = documents?.findIndex(
  //       (document) => document.id === over.id,
  //     );

  //     console.log("this", activeIndex, overIndex);

  //     };
  //   }
  // }

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
        <ScrollArea
          className="-m-2 h-[calc(100dvh-205px)] *:p-2"
          showScrollbar={true}
        >
          {documents ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              // onDragEnd={handleDragEnd}
            >
               {/* Documents list */}
              <ul role="list" className="space-y-4">
                <SortableContext
                  items={documents}
                  strategy={verticalListSortingStrategy}
                >
                  {documents.map((document) => {
                    if (dataroomId) {
                      return (
                        <DataroomDocumentCard
                          key={document.id}
                          document={document as DataroomFolderDocument}
                          teamInfo={teamInfo}
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
                  })}
                </SortableContext>
              </ul>
            </DndContext>
          ) : (
            Array.from({ length: 3 }).map((_, i) => (
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
            ))
          )}

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
                        isDataroom={dataroomId ? true : false}
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
            </ul>

            {documents && documents.length === 0 && (
              <div className="flex items-center justify-center">
                <EmptyDocuments />
              </div>
            )}
          </div>
        </ScrollArea>
      </UploadZone>
      <UploadNotificationDrawer
        open={showDrawer}
        onOpenChange={setShowDrawer}
        uploads={uploads}
        setUploads={setUploads}
        rejectedFiles={rejectedFiles}
        setRejectedFiles={setRejectedFiles}
      />
    </>
  );
}
