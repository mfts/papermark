import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTeam } from "@/context/team-context";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { SidebarFolderTreeSelection } from "@/components/sidebar-folders";
import { useRouter } from "next/router";

export function AddDataroomDocumentModal({
  open,
  setOpen,
  dataroomId,
  documentName,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dataroomId?: string;
  documentName?: string;
}) {
  const router = useRouter();
  const [folderId, setFolderId] = useState<string>("");
  const [documentId, setDocumentId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const teamInfo = useTeam();

  /** current folder name */
  const currentFolderPath = router.query.name as string[] | undefined;

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    if (folderId === "") return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/documents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId: documentId,
            folderPathName: currentFolderPath?.join("/"),
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

      // mutate(`/api/teams/${teamInfo?.currentTeam?.id}/folders`);
      // mutate(`/api/teams/${teamInfo?.currentTeam?.id}/folders${oldPath}`);
      // mutate(`/api/teams/${teamInfo?.currentTeam?.id}/folders${newPath}`).then(
      //   () => {
      //     router.push(`/documents/tree${newPath}`);
      //   },
      // );
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
          <DialogTitle>Add Document</DialogTitle>
          <DialogDescription>Add your document to dataroom</DialogDescription>
        </DialogHeader>
        <form>
          <div className="mb-2">
            <SidebarFolderTreeSelection
              selectedFolderId={folderId}
              setFolderId={setFolderId}
            />
          </div>

          <DialogFooter>
            <Button
              onClick={handleSubmit}
              className="w-full h-9"
              loading={loading}
            >
              Add to dataroom
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
