import { useCallback, useState } from "react";

import { useTeam } from "@/context/team-context";
import { Textarea } from "@tremor/react";
import { toast } from "sonner";
import { mutate } from "swr";

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
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
  }>({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(openModal);

  const teamInfo = useTeam();
  const { plan } = usePlan();
  const analytics = useAnalytics();

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!formData.name || !formData.description) {
        toast.error("Please fill in all fields.");
        return;
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
              name: formData.name.trim(),
              description: formData.description,
            }),
          },
        );

        if (!response.ok) {
          const { message } = await response.json();
          setLoading(false);

          toast.error(message);
          return;
        }
        analytics.capture("Dataroom Created", { dataroomName: formData.name });
        toast.success("Dataroom successfully created! 🎉");

        // Revalidate the data rooms list
        mutate(`/api/teams/${teamInfo?.currentTeam?.id}/datarooms`);
      } catch (error) {
        setLoading(false);
        toast.error("Error adding dataroom. Please try again.");
      } finally {
        setLoading(false);
        setOpen(false);
        if (openModal && setOpenModal) setOpenModal(false);
        setFormData({
          description: "",
          name: "",
        });
      }
    },
    [formData, teamInfo?.currentTeam?.id, analytics, openModal, setOpenModal],
  );


  // If the team is on a free plan, show the upgrade modal
  if (plan === "free" || plan === "pro") {
    if (children) {
      return (
        <UpgradePlanModal
          clickedPlan="Data Rooms"
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

    // TODO
    // setFormData({
    //   description: "",
    //   name: "",
    // });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Create dataroom</DialogTitle>
          <DialogDescription>
            Start creating a dataroom with a name and description.
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
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
          />
          <div>
            {/* <div className="flex items-center justify-between"> */}
            <Label htmlFor="dataroom-description" className="opacity-80">
              Dataroom Description
            </Label>
            {/* <p className="text-sm text-muted-foreground">
                {formData.description?.length || 0}/1024
              </p> */}
            {/* </div> */}
            <div className="relative mb-4 mt-1 flex rounded-md shadow-sm">
              <Textarea
                name="dataroom-description"
                id="dataroom-description"
                rows={3}
                // maxLength={1024}
                className="focus:border-none focus:outline-none focus:ring-muted-foreground dark:border-gray-500 dark:bg-gray-800 focus:dark:bg-transparent dark:focus:ring-muted-foreground"
                placeholder={`Add a description to help others understand this data room...`}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                aria-invalid="true"
              />
            </div>
          </div>
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
