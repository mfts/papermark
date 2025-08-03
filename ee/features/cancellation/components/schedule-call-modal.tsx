"use client";

import { useEffect, useState } from "react";

// Cal.com embed imports
import Cal, { getCalApi } from "@calcom/embed-react";
import { ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";

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

interface ScheduleCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: CancellationReason;
  onBack: () => void;
  onDecline: () => void;
}

export function ScheduleCallModal({
  open,
  onOpenChange,
  reason,
  onBack,
  onDecline,
}: ScheduleCallModalProps) {
  const [calLoaded, setCalLoaded] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (open) {
      (async function () {
        try {
          const cal = await getCalApi({ namespace: "papermark-support" });
          cal("ui", { hideEventTypeDetails: true, layout: "month_view" });
          setCalLoaded(true);
        } catch (error) {
          console.error("Error loading Cal.com:", error);
          setCalLoaded(true); // Set to true anyway to show fallback
        }
      })();
    }
  }, [open]);

  const getTitle = () => {
    switch (reason) {
      case "missing-features":
        return "Let's talk about what you need";
      default:
        return "Schedule a consultation call";
    }
  };

  const getSubtitle = () => {
    switch (reason) {
      case "missing-features":
        return "Our team will reach out to understand your requirements";
      default:
        return "We'd love to understand how we can better serve you";
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
          {getTitle()}
        </DialogTitle>
        <DialogDescription className="text-center text-base text-muted-foreground">
          {getSubtitle()}
        </DialogDescription>
      </div>

      <div className="bg-muted px-4 py-8 dark:bg-gray-900 sm:px-8">
        <div className="space-y-6">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="mb-2 text-lg font-semibold text-green-800">
              Free consultation
            </div>
            <div className="text-sm text-green-700">
              30-minute call • within 24 hours
            </div>
          </div>

          {/* Cal.com embed container */}
          <div className="max-h-[540px] rounded-lg border bg-white dark:bg-gray-800">
            {calLoaded ? (
              <Cal
                namespace="papermark-support"
                calLink={`marcseitz/papermark-support?email=${session?.user?.email}&name=${session?.user?.name}`}
                style={{
                  width: "100%",
                  height: "540px",
                  overflow: "scroll",
                }}
                config={{ layout: "month_view" }}
              />
            ) : (
              <div className="flex h-[500px] items-center justify-center">
                <div className="text-center">
                  <div className="mb-2 text-lg font-semibold">
                    Loading calendar...
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Please wait while we load the booking calendar
                  </div>
                </div>
              </div>
            )}
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
              Decline offer
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
