import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAnalytics } from "@/lib/analytics";

export function AddGroupModal({
  open,
  setOpen,
  onAddition,
  dataroomId,
  children,
}: {
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  onAddition?: (folderName: string) => void;
  dataroomId?: string;
  children?: React.ReactNode;
}) {
  const [groupName, setGroupName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const teamInfo = useTeam();
  const analytics = useAnalytics();
  const addGroupSchema = z.object({
    name: z.string().min(3, {
      message: "Please provide a group name with at least 3 characters.",
    }),
  });

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    const validation = addGroupSchema.safeParse({ name: groupName });
    if (!validation.success) {
      return toast.error(validation.error.errors[0].message);
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/groups`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: groupName.trim(),
          }),
        },
      );

      if (!response.ok) {
        const { message } = await response.json();
        setLoading(false);
        toast.error(message);
        return;
      }

      analytics.capture("Group Added", { groupName: groupName, dataroomId });
      toast.success("Group added successfully! 🎉");

      mutate(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/groups`,
      );
    } catch (error) {
      setLoading(false);
      toast.error("Error adding group. Please try again.");
      return;
    } finally {
      setLoading(false);
      setOpen?.(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Add Group</DialogTitle>
          <DialogDescription>You can easily add a group.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Label htmlFor="group-name" className="opacity-80">
            Group Name
          </Label>
          <Input
            id="group-name"
            placeholder="Management Team"
            className="mb-4 mt-1 w-full"
            onChange={(e) => setGroupName(e.target.value)}
          />
          <DialogFooter>
            <Button type="submit" className="h-9 w-full">
              Add new group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
