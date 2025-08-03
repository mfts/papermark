"use client";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Modal } from "@/components/ui/modal";

type CancellationReason =
  | "too-expensive"
  | "not-using-enough"
  | "missing-features"
  | "technical-issues"
  | "switching-competitor"
  | "other";

interface ConfirmCancellationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack: () => void;
  onClose: () => void;
  reason: CancellationReason;
  feedback: string;
  onConfirm?: () => void;
}

export function ConfirmCancellationModal({
  open,
  onOpenChange,
  onBack,
  onClose,
  reason,
  feedback,
  onConfirm,
}: ConfirmCancellationModalProps) {
  const [loading, setLoading] = useState(false);
  const teamInfo = useTeam();

  const handleConfirmCancellation = async () => {
    if (!teamInfo?.currentTeam?.id) {
      toast.error("Team information not found");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${teamInfo.currentTeam.id}/billing/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason,
            feedback,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      const data = await response.json();

      toast.success("Subscription cancelled successfully.");

      // Always show feedback modal after successful cancellation
      console.log("Cancellation successful, calling onConfirm:", !!onConfirm);
      if (onConfirm) {
        onConfirm();
      } else {
        // Fallback if onConfirm not provided - should not happen in normal flow
        console.warn("onConfirm not provided, closing modal");
        onClose();
        window.location.reload();
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      showModal={open}
      setShowModal={(show: boolean | ((prev: boolean) => boolean)) => {
        if (typeof show === "function") {
          onOpenChange(show(open));
        } else {
          onOpenChange(show);
        }
      }}
      className="max-w-lg"
    >
      <div className="flex flex-col items-center justify-center space-y-3 border-b border-border bg-white px-4 py-4 pt-8 dark:border-gray-900 dark:bg-gray-900 sm:px-8">
        <DialogTitle className="text-2xl font-semibold">
          Confirm cancellation
        </DialogTitle>
        <DialogDescription className="text-center text-base text-muted-foreground">
          Your subscription will end on January 15, 2024
        </DialogDescription>
      </div>

      <div className="bg-muted px-4 py-8 dark:bg-gray-900 sm:px-8">
        <div className="space-y-6">
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

          <div className="flex items-center justify-between border-t pt-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancellation}
              loading={loading}
            >
              Confirm cancellation
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
