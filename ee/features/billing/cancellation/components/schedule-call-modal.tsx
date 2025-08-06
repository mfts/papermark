"use client";

import { useEffect, useState } from "react";

import Cal, { getCalApi } from "@calcom/embed-react";
import { useSession } from "next-auth/react";

import { CancellationReason } from "../lib/constants";
import { CancellationBaseModal } from "./reason-base-modal";

interface ScheduleCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: CancellationReason;
  onDecline: () => void;
}

export function ScheduleCallModal({
  open,
  onOpenChange,
  reason,
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
      case "missing_features":
        return "Let's talk about what you need";
      default:
        return "Schedule a consultation call";
    }
  };

  const getSubtitle = () => {
    switch (reason) {
      case "missing_features":
        return "Our team will reach out to understand your requirements";
      default:
        return "We'd love to understand how we can better serve you";
    }
  };

  return (
    <CancellationBaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={getTitle()}
      description={getSubtitle()}
      showKeepButton={true}
      onDecline={onDecline}
    >
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
            calLink={`marcseitz/papermark-support?email=${session?.user?.email || ""}&name=${session?.user?.name || ""}`}
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
    </CancellationBaseModal>
  );
}
