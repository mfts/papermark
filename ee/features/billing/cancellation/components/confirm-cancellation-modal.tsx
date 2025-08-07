"use client";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";

import { useAnalytics } from "@/lib/analytics";
import { usePlan } from "@/lib/swr/use-billing";

import { Button } from "@/components/ui/button";

import { CancellationBaseModal } from "./reason-base-modal";

interface ConfirmCancellationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmCancellation: () => void;
}

export function ConfirmCancellationModal({
  open,
  onOpenChange,
  onConfirmCancellation,
}: ConfirmCancellationModalProps) {
  const [loading, setLoading] = useState(false);
  const { currentTeamId } = useTeam();
  const { plan: currentPlan, endsAt } = usePlan();
  const analytics = useAnalytics();

  const handleConfirmCancellation = async () => {
    if (!currentTeamId) return;

    setLoading(true);

    // If we have a callback, call it instead of redirecting

    try {
      // Still make the API call to get the cancellation URL for future use
      const response = await fetch(
        `/api/teams/${currentTeamId}/billing/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        // track the event
        analytics.capture("Subscription Cancelled", {
          teamId: currentTeamId,
          plan: currentPlan,
          endsAt: endsAt,
        });

        // Call the callback instead of redirecting
        onConfirmCancellation();
        mutate(`/api/teams/${currentTeamId}/billing/plan`);
        mutate(`/api/teams/${currentTeamId}/billing/plan?withDiscount=true`);
      } else {
        toast.error("Something went wrong");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getDescription = `Your subscription will end on ${new Date(
    endsAt!,
  ).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;

  return (
    <CancellationBaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Confirm cancellation"
      description={getDescription}
      showKeepButton={true}
      confirmButton={
        <Button
          variant="destructive"
          onClick={handleConfirmCancellation}
          loading={loading}
        >
          Confirm cancellation
        </Button>
      }
    >
      <div>
        <h3 className="mb-4 text-lg font-semibold">
          After cancellation, you'll lose access to:
        </h3>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-center">
            <span className="mr-3 h-2 w-2 rounded-full bg-muted-foreground"></span>
            All premium features
          </li>
          <li className="flex items-center">
            <span className="mr-3 h-2 w-2 rounded-full bg-muted-foreground"></span>
            Priority customer support
          </li>
          <li className="flex items-center">
            <span className="mr-3 h-2 w-2 rounded-full bg-muted-foreground"></span>
            Advanced analytics
          </li>
          <li className="flex items-center">
            <span className="mr-3 h-2 w-2 rounded-full bg-muted-foreground"></span>
            Team collaboration tools
          </li>
        </ul>
      </div>
    </CancellationBaseModal>
  );
}
