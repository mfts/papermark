import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTeam } from "@/context/team-context";
import { useState } from "react";
import { toast } from "sonner";
import { UpgradePlanModal } from "../billing/upgrade-plan-modal";
import { usePlan } from "@/lib/swr/use-billing";
import { useAnalytics } from "@/lib/analytics";
import { mutate } from "swr";
import { Folder } from "@prisma/client";
import { useFolders } from "@/lib/swr/use-documents";
import { string } from "zod";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { as } from "@upstash/redis/zmscore-5d82e632";
import SidebarFolderTree, {
  SidebarFolderTreeSelection,
} from "../sidebar-folders";
import { useRouter } from "next/router";

export function MoveToFolderModal({
  open,
  setOpen,
  folderPath,
  documentId,
  documentName,
  onAddition,
  children,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  folderPath?: string;
  documentId?: string;
  documentName?: string;
  onAddition?: (folderName: string) => void;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [folderName, setFolderName] = useState<string>("");
  const [folderId, setFolderId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const { folders } = useFolders();

  const teamInfo = useTeam();
  const { plan } = usePlan();
  const analytics = useAnalytics();

  const currentPath = router.query.name
    ? (router.query.name as string[]).join("/")
    : "";

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    if (folderId === "") return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/documents/${documentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            folderId: folderId,
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

      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/folders`);
      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/folders${oldPath}`);
      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/folders${newPath}`).then(
        () => {
          router.push(`/documents/tree${newPath}`);
        },
      );
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
          <SidebarFolderTreeSelection
            selectedFolderId={folderId}
            setFolderId={setFolderId}
          />

          <DialogFooter>
            <Button onClick={handleSubmit} className="w-full h-9">
              Move to folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
