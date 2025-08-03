"use client";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Modal } from "@/components/ui/modal";

interface PauseSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack: () => void;
  onDecline: () => void;
  onClose: () => void;
}

export function PauseSubscriptionModal({
  open,
  onOpenChange,
  onBack,
  onDecline,
  onClose,
}: PauseSubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const teamInfo = useTeam();

  const handlePauseSubscription = async () => {
    if (!teamInfo?.currentTeam?.id) {
      toast.error("Team information not found");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${teamInfo.currentTeam.id}/billing/pause`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to pause subscription");
      }

      const data = await response.json();

      toast.success("Subscription paused successfully!");
      onClose();

      // Refresh the page to show updated billing status
      window.location.reload();
    } catch (error) {
      console.error("Error pausing subscription:", error);
      toast.error("Failed to pause subscription. Please try again.");
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
          Pause your subscription
        </DialogTitle>
        <DialogDescription className="text-center text-base text-muted-foreground">
          Take a break for 3 months and resume when you're ready
        </DialogDescription>
      </div>

      <div className="px-4 py-4 dark:bg-gray-900 sm:px-8">
        <div className="space-y-6">
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/10">
            <div className="mb-4 text-base font-medium text-green-800 dark:text-green-700">
              What pausing means for you?
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                <span className="text-sm font-medium text-green-800 dark:text-green-700">
                  You pay €0 for 3 months
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                <span className="text-sm font-medium text-green-800 dark:text-green-700">
                  All your custom links continue to work
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                <span className="text-sm font-medium text-green-800 dark:text-green-700">
                  All your datarooms are accessible
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={handlePauseSubscription}
            className="w-full"
            size="lg"
            loading={loading}
          >
            Pause for 3 months
          </Button>

          {/* Timeline information */}
          <div className="space-y-3 border-t pt-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Pause starts:</span>
                <span className="font-medium">Today</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Reminder email:</span>
                <span className="font-medium">3 days before resume</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Auto-resume date:</span>
                <span className="font-medium">
                  {new Date(
                    Date.now() + 90 * 24 * 60 * 60 * 1000,
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
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
            <Button variant="outline" onClick={onDecline}>
              Continue to cancellation
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
