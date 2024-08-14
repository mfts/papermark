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

    const key = `/api/teams/${teamId}/datarooms/${dataroomId}${currentPath !== "" ? `/folders/documents/${currentPath}` : "/documents"}`;

    mutate(
      key,
      (documents: any[] | undefined) => {
        if (!documents) return documents;

        // Filter out the document that are being moved
        const updatedDocuments = documents.filter(
          (doc) => doc.id !== documentId,
        );

        // Return the updated list of documents
        return updatedDocuments;
      },
      false,
    );

    try {
      const response = await fetch(
        `/api/teams/${teamId}/datarooms/${dataroomId}/documents/${documentId}`,
        {
          method: "PATCH",
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

      const { newPath } = (await response.json()) as {
        newPath: string;
      };

      // update current folder
      mutate(key);
      // update new folder (or home)
      mutate(
        `/api/teams/${teamId}/datarooms/${dataroomId}${newPath ? `/folders/documents${newPath}` : "/documents"}`,
      );
      // update folder document counts in new path
      mutate(
        `/api/teams/${teamId}/datarooms/${dataroomId}/folders${newPath ? `${newPath}` : "?root=true"}`,
      );
      // update folder document counts in current path
      mutate(
        `/api/teams/${teamId}/datarooms/${dataroomId}/folders${currentPath !== "" ? `/${currentPath}` : "?root=true"}`,
      );

      toast.success("Document moved successfully!");
    } catch (error) {
      console.error("Error moving document", error);
      toast.error("Failed to move document");
      // Revert the UI back to the previous state
      mutate(key);
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
