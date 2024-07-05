import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";

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
  documentId,
  documentName,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dataroomId: string;
  documentId?: string;
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
    try {
      const response = await fetch(
        `/api/teams/${teamId}/datarooms/${dataroomId}/documents/${documentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            folderId: selectedFolder.id,
            currentPathName: "/" + currentPath,
          }),
        },
      );

      if (!response.ok) {
        const { message } = await response.json();
        setLoading(false);
        toast.error(message);
        return;
      }

      const { newPath, oldPath } = (await response.json()) as {
        newPath: string;
        oldPath: string;
      };

      toast.success("Document moved successfully!");

      mutate(`/api/teams/${teamId}/datarooms/${dataroomId}/folders`);
      mutate(`/api/teams/${teamId}/datarooms/${dataroomId}/folders${oldPath}`);
      mutate(
        `/api/teams/${teamId}/datarooms/${dataroomId}/folders${newPath}`,
      ).then(() => {
        router.push(`/datarooms/${dataroomId}/documents${newPath}`);
      });
    } catch (error) {
      console.error("Error moving document", error);
      toast.error("Failed to move document. Try again.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>
            Move <span className="font-bold">{documentName}</span>
          </DialogTitle>
          <DialogDescription>Move your document to a folder.</DialogDescription>
        </DialogHeader>
        <form>
          <div className="mb-2">
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
