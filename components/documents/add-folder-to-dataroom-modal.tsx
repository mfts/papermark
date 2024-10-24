import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import useDatarooms from "@/lib/swr/use-datarooms";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export type TSelectedDataroom = { id: string; name: string } | null;

export function AddFolderToDataroomModal({
  open,
  setOpen,
  folderId,
  folderName,
  isMoving,
  handleDeleteFolder,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  folderId?: string;
  handleDeleteFolder?: (folderId: string) => Promise<void>;
  isMoving?: boolean;
  folderName?: string;
}) {
  const router = useRouter();
  const [selectedDataroom, setSelectedDataroom] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { datarooms } = useDatarooms();

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    if (!selectedDataroom) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/teams/${teamId}/folders/manage/${folderId}/add-to-dataroom`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dataroomId: selectedDataroom,
          }),
        },
      );

      if (!response.ok) {
        const { message } = await response.json();
        setLoading(false);
        toast.error(message);
        return;
      }
      if (isMoving && folderId && handleDeleteFolder) {
        handleDeleteFolder(folderId);
      }
      toast.success(
        `Folder ${isMoving ? "moved" : "added"} to dataroom successfully!`,
      );
    } catch (error) {
      console.error(
        `Error ${isMoving ? "moving" : "adding"} folder to dataroom`,
        error,
      );
      toast.error(
        `Failed to ${isMoving ? "move" : "add"} folder to dataroom. Try again.`,
      );
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
            <span className="font-bold">{folderName}</span>
          </DialogTitle>
          <DialogDescription>
            {isMoving ? "Move" : "Add"} your folder to a dataroom.
          </DialogDescription>
        </DialogHeader>
        <Select onValueChange={(value) => setSelectedDataroom(value)}>
          <SelectTrigger className="min-w-fit">
            <SelectValue placeholder="Select a dataroom" />
          </SelectTrigger>
          <SelectContent>
            {datarooms?.map((dataroom) => (
              <SelectItem key={dataroom.id} value={dataroom.id}>
                {dataroom.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <form>
          <div className="mb-2"></div>

          <DialogFooter>
            <Button
              onClick={handleSubmit}
              className="flex h-9 w-full gap-1"
              loading={loading}
              disabled={!selectedDataroom}
            >
              {!selectedDataroom ? (
                "Select a dataroom"
              ) : (
                <>
                  {isMoving ? "Move" : "Add"} to{" "}
                  <span className="font-medium">
                    {
                      datarooms?.filter((d) => d.id === selectedDataroom)[0]
                        .name
                    }
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
