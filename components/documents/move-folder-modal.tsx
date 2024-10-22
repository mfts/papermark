import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";

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

import { moveDocumentToFolder } from "@/lib/documents/move-documents";

export type TSelectedFolder = { id: string | null; name: string } | null;

export function MoveToFolderModal({
  open,
  setOpen,
  setSelectedDocuments,
  documentIds,
  documentName,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
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

    await moveDocumentToFolder({
      documentIds,
      folderId: selectedFolder.id!,
      folderPathName: currentPath ? currentPath.split("/") : undefined,
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
            Move
            <div className="w-[376px] truncate font-bold">
              {documentName ? documentName : `${documentIds.length} items`}
            </div>
          </DialogTitle>
          <DialogDescription>Move your document to a folder.</DialogDescription>
        </DialogHeader>
        <form>
          <div className="mb-2 max-h-[75vh] overflow-y-scroll">
            <SidebarFolderTreeSelection
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
