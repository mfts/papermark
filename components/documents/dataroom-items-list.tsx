import { useState } from "react";
import React from "react";

import { TeamContextType } from "@/context/team-context";

import { UploadNotificationDrawer } from "@/components/upload-notification";
import UploadZone from "@/components/upload-zone";

import {
  DataroomFolderDocument,
  DataroomFolderWithCount,
} from "@/lib/swr/use-dataroom";

import DataroomDocumentCard from "../datarooms/dataroom-document-card";
import { EmptyDocuments } from "./empty-document";
import FolderCard from "./folder-card";

type FolderOrDocument =
  | (DataroomFolderWithCount & { itemType: "folder" })
  | (DataroomFolderDocument & { itemType: "document" });

// const isFolder = (item: FolderOrDocument): item is DataroomFolderWithCount =>
//   "_count" in item && "childFolders" in item._count;

export function DataroomItemsList({
  mixedItems,
  teamInfo,
  folderPathName,
  dataroomId,
}: {
  mixedItems: FolderOrDocument[] | [];
  teamInfo: TeamContextType | null;
  folderPathName?: string[];
  dataroomId: string;
}) {
  const [uploads, setUploads] = useState<
    { fileName: string; progress: number; documentId?: string }[]
  >([]);
  const [rejectedFiles, setRejectedFiles] = useState<
    { fileName: string; message: string }[]
  >([]);

  const [showDrawer, setShowDrawer] = useState(false);

  const renderItem = (item: FolderOrDocument) => {
    const itemId = `${item.itemType}-${item.id}`;

    return (
      <>
        {item.itemType === "folder" ? (
          <FolderCard
            key={itemId}
            folder={item}
            teamInfo={teamInfo}
            isDataroom={!!dataroomId}
            dataroomId={dataroomId}
          />
        ) : (
          <DataroomDocumentCard
            key={itemId}
            document={item as DataroomFolderDocument}
            teamInfo={teamInfo}
            dataroomId={dataroomId}
          />
        )}
      </>
    );
  };

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
        <ul role="list" className="space-y-4">
          {mixedItems.map(renderItem)}
        </ul>

        {!mixedItems.length && (
          <div className="flex items-center justify-center">
            <EmptyDocuments />
          </div>
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
