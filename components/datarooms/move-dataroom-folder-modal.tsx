import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";

import { SidebarFolderTreeSelection } from "@/components/datarooms/folders";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { moveDataroomDocumentToFolder } from "@/lib/documents/move-dataroom-documents";

import { TSelectedFolder } from "../documents/move-folder-modal";

export function MoveToDataroomFolderModal({
  open,
  setOpen,
  dataroomId,
  setSelectedDocuments,
  documentIds,
  documentName,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dataroomId: string;
  setSelectedDocuments?: React.Dispatch<React.SetStateAction<string[]>>;
  documentIds: string[];
  documentName?: string;
}) {
  const router = useRouter();
  const [selectedFolder, setSelectedFolder] = useState<TSelectedFolder>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const currentPath = router.query.name
    ? (router.query.name as string[]).join("/")
    : "";

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    if (!selectedFolder) return;

    setLoading(true);

    await moveDataroomDocumentToFolder({
      documentIds,
      folderId: selectedFolder.id!,
      folderPathName: currentPath ? currentPath.split("/") : undefined,
      dataroomId,
      teamId,
    });

    setLoading(false);
    setOpen(false); // Close the modal
    setSelectedDocuments?.([]); // Clear the selected documents
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>
            Move{" "}
            <span className="font-bold">
              {documentName ? documentName : `${documentIds.length} items`}
            </span>
          </DialogTitle>
          <DialogDescription>Move your document to a folder.</DialogDescription>
        </DialogHeader>
        <form>
          <div className="mb-2 max-h-[75vh] overflow-y-scroll">
            <SidebarFolderTreeSelection
              dataroomId={dataroomId}
              selectedFolder={selectedFolder}
              setSelectedFolder={setSelectedFolder}
            />
          </div>

          <DialogFooter>
            <Button
              onClick={handleSubmit}
              className="flex h-9 w-full gap-1"
              loading={loading}
              disabled={!selectedFolder}
            >
              {!selectedFolder ? (
                "Select a folder"
              ) : (
                <>
                  Move to{" "}
                  <span className="font-medium">{selectedFolder.name}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
