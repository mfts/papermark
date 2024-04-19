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
import { useRouter } from "next/router";

export function EditFolderModal({
  open,
  setOpen,
  name,
  folderId,
  onAddition,
  isDataroom,
  dataroomId,
  children,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  name: string;
  folderId: string;
  onAddition?: (folderName: string) => void;
  isDataroom?: boolean;
  dataroomId?: string;
  children?: React.ReactNode;
}) {
  const [folderName, setFolderName] = useState<string>(name);
  const [loading, setLoading] = useState<boolean>(false);

  const teamInfo = useTeam();

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    if (folderName == "") return;

    setLoading(true);
    const endpointTargetType =
      isDataroom && dataroomId ? `datarooms/${dataroomId}/folders` : "folders";

    try {
      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}/manage`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            folderId: folderId,
            name: folderName,
          }),
        },
      );

      if (!response.ok) {
        const { message } = await response.json();
        setLoading(false);
        toast.error(message);
        return;
      }

      const { parentFolderPath } = await response.json();

      toast.success("Folder updated successfully! 🎉");

      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}`);
      mutate(
        `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}?root=true`,
      );
      mutate(
        `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}${parentFolderPath}`,
      );
    } catch (error) {
      setLoading(false);
      toast.error("Error updating folder. Please try again.");
      return;
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Edit Folder</DialogTitle>
          <DialogDescription>Enter a new folder name.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Label htmlFor="folder-name-update" className="opacity-80">
            Folder Name
          </Label>
          <Input
            id="folder-name-update"
            value={folderName}
            placeholder="folder-123"
            className="w-full mt-1 mb-4"
            onChange={(e) => setFolderName(e.target.value)}
          />
          <DialogFooter>
            <Button type="submit" className="w-full h-9" loading={loading}>
              Update folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
