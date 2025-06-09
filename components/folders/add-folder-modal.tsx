import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";
import slugify from "@sindresorhus/slugify";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAnalytics } from "@/lib/analytics";
import { usePlan } from "@/lib/swr/use-billing";

import { UpgradePlanModal } from "../billing/upgrade-plan-modal";

export function AddFolderModal({
  // open,
  // setOpen,
  onAddition,
  isDataroom,
  dataroomId,
  children,
}: {
  // open?: boolean;
  // setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  onAddition?: (folderName: string) => void;
  isDataroom?: boolean;
  dataroomId?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [folderName, setFolderName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  const teamInfo = useTeam();
  const { isFree, isTrial } = usePlan();
  const analytics = useAnalytics();

  /** current folder name */
  const currentFolderPath = router.query.name as string[] | undefined;

  const folderPath =
    isDataroom && dataroomId
      ? `/datarooms/${dataroomId}/documents/${currentFolderPath ? currentFolderPath?.join("/") : ""}/${"/" + slugify(folderName.trim())}`
      : `/documents/tree/${currentFolderPath ? currentFolderPath?.join("/") : ""}${"/" + slugify(folderName.trim())}`;

  const addFolderSchema = z.object({
    name: z.string().min(3, {
      message: "Please provide a folder name with at least 3 characters.",
    }),
  });

  const validation = addFolderSchema.safeParse({ name: folderName });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    const endpointTargetType =
      isDataroom && dataroomId ? `datarooms/${dataroomId}/folders` : "folders";

    try {
      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: folderName.trim(),
            path: currentFolderPath?.join("/"),
          }),
        },
      );

      if (!response.ok) {
        const { message } = await response.json();
        setLoading(false);
        toast.error(message.error);
        return;
      }

      const { parentFolderPath } = await response.json();

      analytics.capture("Folder Added", {
        folderName: folderName.trim(),
        dataroomId,
      });
      toast.success(`Folder added successfully!`, {
        description: `"${folderName.trim()}"`,
        action: {
          label: "Open folder",
          onClick: () => router.push(folderPath),
        },
        duration: 10000,
      });

      mutate(
        `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}?root=true`,
      );
      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}`);
      mutate(
        `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}${parentFolderPath}`,
      );
    } catch (error) {
      setLoading(false);
      toast.error("Error adding folder. Please try again.");
      return;
    } finally {
      setFolderName("");
      setLoading(false);
      setOpen(false);
    }
  };

  // If the team is on a free plan, show the upgrade modal
  if (isFree && (!isDataroom || !isTrial)) {
    if (children) {
      return (
        <UpgradePlanModal
          clickedPlan={PlanEnum.Pro}
          trigger={"add_folder_button"}
        >
          {children}
        </UpgradePlanModal>
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Add Folder</DialogTitle>
          <DialogDescription>You can easily add a folder.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Label htmlFor="folder-name" className="opacity-80">
            Folder Name
          </Label>
          <Input
            id="folder-name"
            placeholder="folder-123"
            className="mb-4 mt-1 w-full"
            onChange={(e) => setFolderName(e.target.value)}
          />
          <DialogFooter>
            <Button
              type="submit"
              className="h-9 w-full"
              disabled={!validation.success}
              loading={loading}
            >
              Add new folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
