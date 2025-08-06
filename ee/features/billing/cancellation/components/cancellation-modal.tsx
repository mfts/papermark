import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";

import { useAnalytics } from "@/lib/analytics";

import { type CancellationReason } from "../lib/constants";
import { ConfirmCancellationModal } from "./confirm-cancellation-modal";
import { FeedbackModal } from "./feedback-modal";
import { PauseSubscriptionModal } from "./pause-subscription-modal";
import { CancellationBaseModal } from "./reason-base-modal";
import { RetentionOfferModal } from "./retention-offer-modal";
import { ScheduleCallModal } from "./schedule-call-modal";

type CancellationStep =
  | "reason"
  | "retention-offer"
  | "pause-offer"
  | "feedback"
  | "confirm"
  | "schedule-call"
  | "final-feedback";

interface CancellationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancellationModal({
  open,
  onOpenChange,
}: CancellationModalProps) {
  // Start with pause offer - this should be the first thing users see
  const [currentStep, setCurrentStep] =
    useState<CancellationStep>("pause-offer");
  const [selectedReason, setSelectedReason] =
    useState<CancellationReason | null>(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const { currentTeamId } = useTeam();
  const analytics = useAnalytics();

  const reasons: { value: CancellationReason; label: string }[] = [
    { value: "too_expensive", label: "It's too expensive" },
    { value: "unused", label: "I don't use the service enough" },
    { value: "missing_features", label: "Some features are missing" },
    {
      value: "switched_service",
      label: "I'm switching to a different service",
    },
    { value: "other", label: "Other reason" },
  ];

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      const timeoutId = setTimeout(() => {
        setCurrentStep("pause-offer");
        setSelectedReason(null);
        setFeedback("");
        setLoading(false);
      }, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  const handleReasonClick = (reason: CancellationReason) => {
    setSelectedReason(reason);
    // Route based on reason - only "other" goes to feedback first
    switch (reason) {
      case "too_expensive":
        setCurrentStep("retention-offer");
        break;
      case "unused":
        setCurrentStep("confirm"); // Go directly to cancellation flow for unused
        break;
      case "missing_features":
        setCurrentStep("schedule-call");
        break;
      case "switched_service":
        setCurrentStep("retention-offer");
        break;
      case "other":
        setCurrentStep("feedback"); // Only "other" goes to feedback first
        break;
      default:
        setCurrentStep("confirm");
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case "reason":
        // From reason selection, go back to pause offer
        setCurrentStep("pause-offer");
        break;
      case "retention-offer":
      case "schedule-call":
        setCurrentStep("reason");
        break;
      case "feedback":
        // From "other" reason feedback, go back to reason selection
        setCurrentStep("reason");
        break;
      case "confirm":
        // Go back to the appropriate step based on reason
        if (selectedReason === "missing_features") {
          setCurrentStep("schedule-call");
        } else if (selectedReason === "unused") {
          setCurrentStep("reason"); // Go back to reason selection for unused
        } else if (selectedReason === "other") {
          setCurrentStep("feedback"); // Go back to "other" feedback
        } else {
          setCurrentStep("retention-offer");
        }
        break;
      case "final-feedback":
        // From final feedback, close modal
        onOpenChange(false);
        break;
      case "pause-offer":
      default:
        onOpenChange(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleFinalFeedbackSubmit = async () => {
    if (!currentTeamId || !selectedReason) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${currentTeamId}/billing/cancellation-feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: selectedReason,
            feedback: feedback,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();

        // Track in PostHog
        analytics.capture("Cancellation Feedback Submitted", {
          teamId: currentTeamId,
          reason: selectedReason,
          reasonLabel: data.feedbackData?.reasonLabel || selectedReason,
          feedback: feedback || "",
          hasCustomFeedback: !!feedback,
        });

        toast.success("Thank you for your feedback!");
        mutate(`/api/teams/${currentTeamId}/billing/plan`);
        mutate(`/api/teams/${currentTeamId}/billing/plan?withDiscount=true`);
        onOpenChange(false);
      } else {
        throw new Error("Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Sorry, we couldn't submit your feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return null;
  }

  if (currentStep === "pause-offer") {
    return (
      <PauseSubscriptionModal
        open={open}
        onOpenChange={onOpenChange}
        onBack={handleBack}
        onDecline={() => setCurrentStep("reason")} // Declining pause leads to reason selection
        onClose={handleClose}
      />
    );
  }

  if (currentStep === "reason" || !selectedReason) {
    return (
      <CancellationBaseModal
        open={open}
        onOpenChange={onOpenChange}
        title="Why do you want to cancel?"
        description="Help us understand what we could improve"
        showKeepButton={true}
        onBack={handleBack}
      >
        <div className="space-y-3">
          {reasons.map((reason) => (
            <button
              key={reason.value}
              onClick={() => handleReasonClick(reason.value)}
              className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:ring-1 hover:ring-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:hover:ring-gray-200"
            >
              <div className="text-sm font-medium">{reason.label}</div>
            </button>
          ))}
        </div>
      </CancellationBaseModal>
    );
  }

  if (currentStep === "retention-offer") {
    return (
      <RetentionOfferModal
        open={open}
        onOpenChange={onOpenChange}
        reason={selectedReason}
        onBack={handleBack}
        onDecline={() => setCurrentStep("confirm")}
        onClose={handleClose}
      />
    );
  }

  if (currentStep === "schedule-call") {
    return (
      <ScheduleCallModal
        open={open}
        onOpenChange={onOpenChange}
        reason={selectedReason}
        onDecline={() => setCurrentStep("confirm")}
      />
    );
  }

  if (currentStep === "feedback") {
    return (
      <FeedbackModal
        open={open}
        onOpenChange={onOpenChange}
        reason={selectedReason}
        feedback={feedback}
        onFeedbackChange={setFeedback}
        onBack={handleBack}
        onContinue={() => {
          // For "other" reason, continue to confirmation
          setCurrentStep("confirm");
        }}
        isFinalStep={false} // This is the "other" reason feedback, not final
      />
    );
  }

  if (currentStep === "confirm") {
    return (
      <ConfirmCancellationModal
        open={open}
        onOpenChange={onOpenChange}
        onConfirmCancellation={() => {
          // After cancellation is confirmed, show feedback modal
          setCurrentStep("final-feedback");
        }}
      />
    );
  }

  if (currentStep === "final-feedback") {
    return (
      <FeedbackModal
        open={open}
        onOpenChange={onOpenChange}
        reason={selectedReason}
        feedback={feedback}
        onFeedbackChange={setFeedback}
        onBack={handleBack}
        onContinue={handleFinalFeedbackSubmit}
        isFinalStep={true} // This is the final feedback
        loading={loading}
      />
    );
  }

  return null;
}
