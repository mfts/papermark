import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";
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

export function AddDataroomModal({
  children,
  openModal = false,
  setOpenModal,
}: {
  children?: React.ReactNode;
  openModal?: boolean;
  setOpenModal?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const [dataroomName, setDataroomName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(openModal);

  const teamInfo = useTeam();
  const { isFree, isPro } = usePlan();
  const analytics = useAnalytics();
  const dataroomSchema = z.object({
    name: z.string().trim().min(3, {
      message: "Please provide a dataroom name with at least 3 characters.",
    }),
  });

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    const validation = dataroomSchema.safeParse({ name: dataroomName });
    if (!validation.success) {
      return toast.error(validation.error.errors[0].message);
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: dataroomName.trim(),
          }),
        },
      );

      if (!response.ok) {
        const { message } = await response.json();
        setLoading(false);
        toast.error(message);
        return;
      }

      const { dataroom } = await response.json();

      analytics.capture("Dataroom Created", { dataroomName: dataroomName });

      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/datarooms`);
      toast.success("Dataroom successfully created! 🎉");
      router.push(`/datarooms/${dataroom.id}/documents`);
    } catch (error) {
      setLoading(false);
      toast.error("Error adding dataroom. Please try again.");
      return;
    } finally {
      setLoading(false);
      setOpen(false);
      if (openModal && setOpenModal) setOpenModal(false);
    }
  };

  // If the team is on a free plan, show the upgrade modal
  if (isFree || isPro) {
    if (children) {
      return (
        <UpgradePlanModal
          clickedPlan={PlanEnum.DataRooms}
          trigger={"add_dataroom_overview"}
        >
          {children}
        </UpgradePlanModal>
      );
    }
  }

  const onOpenChange = (open: boolean) => {
    if (!open) {
      setOpen(false);
    } else {
      setOpen(true);
    }
    if (openModal && setOpenModal) setOpenModal(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Create dataroom</DialogTitle>
          <DialogDescription>
            Start creating a dataroom with a name.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Label htmlFor="dataroom-name" className="opacity-80">
            Dataroom Name
          </Label>
          <Input
            id="dataroom-name"
            placeholder="ACME Aquisition"
            className="mb-4 mt-1 w-full"
            onChange={(e) => setDataroomName(e.target.value)}
          />
          <DialogFooter>
            <Button type="submit" className="h-9 w-full" loading={loading}>
              Add new dataroom
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
