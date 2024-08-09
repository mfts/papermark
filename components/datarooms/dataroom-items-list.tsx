import { useState } from "react";

import { TeamContextType } from "@/context/team-context";

import { EmptyDocuments } from "@/components/documents/empty-document";
import FolderCard from "@/components/documents/folder-card";
import { UploadNotificationDrawer } from "@/components/upload-notification";
import UploadZone from "@/components/upload-zone";

import {
  DataroomFolderDocument,
  DataroomFolderWithCount,
} from "@/lib/swr/use-dataroom";

import DataroomDocumentCard from "./dataroom-document-card";

type FolderOrDocument =
  | (DataroomFolderWithCount & { itemType: "folder" })
  | (DataroomFolderDocument & { itemType: "document" });

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

        {mixedItems.length === 0 && (
          <div className="flex h-full justify-center">
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
