import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";

import { moveDataroomDocumentToFolder } from "@/lib/documents/move-dataroom-documents";
import { moveDataroomFolderToFolder } from "@/lib/documents/move-dataroom-folders";

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

import { TSelectedFolder } from "../documents/move-folder-modal";

export function MoveToDataroomFolderModal({
  open,
  setOpen,
  dataroomId,
  setSelectedDocuments,
  documentIds,
  itemName,
  folderIds,
  folderParentId,
  setSelectedFoldersId,
}: {
  open: boolean;
  folderIds: string[];
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dataroomId: string;
  setSelectedDocuments?: React.Dispatch<React.SetStateAction<string[]>>;
  documentIds?: string[];
  itemName?: string;
  folderParentId?: string;
  setSelectedFoldersId?: React.Dispatch<React.SetStateAction<string[]>>;
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
    if (folderParentId === selectedFolder.id) {
      toast.error("Folder is already in the selected folder.");
      setLoading(false);
      return;
    }
    if (folderIds.includes(selectedFolder.id!)) {
      toast.error("Cannot move to the same folder.");
      setLoading(false);
      return;
    }
    if (documentIds && documentIds.length > 0) {
      await moveDataroomDocumentToFolder({
        documentIds,
        folderId: selectedFolder.id!,
        folderPathName: currentPath ? currentPath.split("/") : undefined,
        dataroomId,
        teamId,
        folderIds,
      });
    }
    if (folderIds && folderIds.length > 0) {
      await moveDataroomFolderToFolder({
        folderIds: folderIds,
        folderPathName: currentPath ? currentPath.split("/") : undefined,
        teamId,
        selectedFolder: selectedFolder.id!,
        dataroomId: dataroomId,
        selectedFolderPath: selectedFolder.path!,
      });
    }

    setLoading(false);
    setOpen(false); // Close the modal
    setSelectedDocuments?.([]); // Clear the selected documents
    setSelectedFoldersId?.([]); // Clear the selected folders
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>
            Move{" "}
            <span className="font-bold">
              {`${(documentIds?.length ?? 0) + (folderIds?.length ?? 0)} items`}
            </span>
          </DialogTitle>
          <DialogDescription>Move your item to a folder.</DialogDescription>
        </DialogHeader>
        <form>
          <div className="mb-2 max-h-[75vh] overflow-x-hidden overflow-y-scroll">
            <SidebarFolderTreeSelection
              dataroomId={dataroomId}
              selectedFolder={selectedFolder}
              setSelectedFolder={setSelectedFolder}
              disableId={folderIds}
            />
          </div>

          <DialogFooter>
            <Button
              onClick={handleSubmit}
              className="flex h-9 w-full gap-1"
              loading={loading}
              disabled={
                !selectedFolder || folderIds?.includes(selectedFolder.id!)
              }
            >
              {!selectedFolder ? (
                "Select a folder"
              ) : (
                <>
                  Move to{" "}
                  <span className="max-w-[200px] truncate font-medium">
                    {selectedFolder.name}
                  </span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
