import { useState } from "react";

import { useLimits } from "@/ee/limits/swr-handler";
import { toast } from "sonner";
import { mutate } from "swr";

import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { usePlan } from "@/lib/swr/use-billing";
import useDatarooms from "@/lib/swr/use-datarooms";

export default function DuplicateDataroom({
  dataroomId,
  teamId,
}: {
  dataroomId: string;
  teamId?: string;
}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [planModalOpen, setPlanModalOpen] = useState<boolean>(false);
  const { limits } = useLimits();
  const { plan, trial } = usePlan();
  const { datarooms: dataRooms } = useDatarooms();
  const numDatarooms = dataRooms?.length ?? 0;
  const limitDatarooms = limits?.datarooms ?? 1;

  const isBusiness = plan === "business";
  const isDatarooms = plan === "datarooms";
  const isTrialDatarooms = trial === "drtrial";
  const canCreateUnlimitedDatarooms =
    isDatarooms || (isBusiness && numDatarooms < limitDatarooms);

  const handleDuplicateDataroom = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!teamId) {
      return;
    }

    setLoading(true);

    try {
      toast.promise(
        fetch(`/api/teams/${teamId}/datarooms/${dataroomId}/duplicate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }).then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.message || "An error occurred while copying dataroom.",
            );
          }
          return response.json();
        }),
        {
          loading: "Copying dataroom...",
          success: () => {
            mutate(`/api/teams/${teamId}/datarooms`);
            return "Dataroom copied successfully.";
          },
          error: (error) => {
            return error.message;
          },
        },
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const ButtonList = () => {
    if (
      (isBusiness && !canCreateUnlimitedDatarooms) ||
      (isTrialDatarooms && dataRooms && !isBusiness && !isDatarooms)
    ) {
      return (
        <Button onClick={(e) => setPlanModalOpen(true)} loading={loading}>
          Upgrade to Add Datarooms
        </Button>
      );
    } else {
      return (
        <Button onClick={(e) => handleDuplicateDataroom(e)} loading={loading}>
          Duplicate Dataroom
        </Button>
      );
    }
  };

  return (
    <div className="rounded-lg">
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>Duplicate Dataroom</CardTitle>
          <CardDescription>
            Create a new data room with the same content (folders and files) as
            this data room.
          </CardDescription>
        </CardHeader>
        <CardContent></CardContent>
        <CardFooter className="flex items-center justify-end rounded-b-lg border-t px-6 py-3">
          <div className="shrink-0">{ButtonList()}</div>
        </CardFooter>
      </Card>
      {planModalOpen ? (
        <UpgradePlanModal
          clickedPlan="Data Rooms"
          trigger="datarooms"
          open={planModalOpen}
          setOpen={setPlanModalOpen}
        />
      ) : null}
    </div>
  );
}
