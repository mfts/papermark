import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";

import { SidebarFolderTreeSelection } from "@/components/datarooms/folders";
import { TSelectedFolder } from "@/components/documents/move-folder-modal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface MoveTrashToDataroomFolderModalProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dataroomId: string;
  folderIds: string[];
  documentIds: string[];
  setSelectedDocuments?: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedFoldersId?: React.Dispatch<React.SetStateAction<string[]>>;
  itemName: string;
  root?: boolean;
  name?: string[];
}

export function MoveTrashToDataroomFolderModal({
  open,
  setOpen,
  dataroomId,
  folderIds,
  documentIds,
  setSelectedDocuments,
  setSelectedFoldersId,
  itemName,
  root,
  name,
}: MoveTrashToDataroomFolderModalProps) {
  const router = useRouter();
  const [selectedFolder, setSelectedFolder] = useState<TSelectedFolder>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const getTrashPath = () => {
    return `${root ? "?root=true" : name ? `/${name.join("/")}` : ""}`;
  };
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    if (!selectedFolder || !teamId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/teams/${teamId}/datarooms/${dataroomId}/trash/manage/move`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            trashItemIds: [...documentIds, ...folderIds],
            selectedFolderId: selectedFolder.id,
            selectedFolderPath: selectedFolder.path,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to move items");
      }

      toast.success("Items moved successfully");
      setOpen(false);
      setSelectedDocuments?.([]);
      setSelectedFoldersId?.([]);
      mutate(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/trash${getTrashPath()}`,
      );
      mutate(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/trash`,
      );
      mutate(`/api/teams/${teamId}/datarooms/${dataroomId}/folders`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to move items",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>
            Move <span className="font-bold">{itemName}</span>
          </DialogTitle>
          <DialogDescription>Move your items to a folder.</DialogDescription>
        </DialogHeader>
        <form>
          <div className="mb-2 max-h-[75vh] overflow-y-scroll">
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
