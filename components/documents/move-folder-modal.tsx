import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";

import { moveDocumentToFolder } from "@/lib/documents/move-documents";
import { moveFolderToFolder } from "@/lib/documents/move-folder";

import { SidebarFolderTreeSelection } from "@/components/sidebar-folders";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type TSelectedFolder = {
  id: string | null;
  name: string;
  path?: string | null;
} | null;

export function MoveToFolderModal({
  open,
  setOpen,
  setSelectedDocuments,
  documentIds,
  itemName,
  folderIds,
  folderParentId,
  setSelectedFoldersId,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedDocuments?: React.Dispatch<React.SetStateAction<string[]>>;
  documentIds?: string[];
  itemName?: string;
  folderIds?: string[];
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

    if (folderParentId === selectedFolder?.id) {
      toast.error("Item is already in the selected folder.");
      setLoading(false);
      return;
    }

    if (folderIds?.includes(selectedFolder.id!)) {
      toast.error("Cannot move folder to itself.");
      setLoading(false);
      return;
    }
    if (documentIds && documentIds.length > 0) {
      await moveDocumentToFolder({
        documentIds,
        folderId: selectedFolder.id!,
        folderPathName: currentPath ? currentPath.split("/") : undefined,
        teamId,
      });
    }
    if (folderIds && folderIds.length > 0) {
      await moveFolderToFolder({
        folderIds: folderIds,
        folderPathName: currentPath ? currentPath.split("/") : undefined,
        teamId,
        selectedFolder: selectedFolder.id!,
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
            Move
            <div className="truncate font-bold">
              {`${(documentIds?.length ?? 0) + (folderIds?.length ?? 0)} items`}
            </div>
          </DialogTitle>
          <DialogDescription>Move your item to a folder.</DialogDescription>
        </DialogHeader>
        <form>
          <div className="mb-2 max-h-[75vh] overflow-x-hidden overflow-y-scroll">
            <SidebarFolderTreeSelection
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
