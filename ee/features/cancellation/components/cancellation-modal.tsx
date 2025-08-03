import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Modal } from "@/components/ui/modal";

import { ConfirmCancellationModal } from "./confirm-cancellation-modal";
import { FeedbackModal } from "./feedback-modal";
import { PauseSubscriptionModal } from "./pause-subscription-modal";
import { RetentionOfferModal } from "./retention-offer-modal";
import { ScheduleCallModal } from "./schedule-call-modal";

type CancellationReason =
  | "too-expensive"
  | "not-using-enough"
  | "missing-features"
  | "technical-issues"
  | "switching-competitor"
  | "other";

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

  // Absolutely ensure we start with pause offer when component mounts
  useEffect(() => {
    setCurrentStep("pause-offer");
    setSelectedReason(null);
    setFeedback("");
    setLoading(false);
  }, []); // Run once on mount

  // Debug state changes
  useEffect(() => {
    console.log("Current step changed to:", currentStep);
  }, [currentStep]);

  const router = useRouter();
  const teamInfo = useTeam();

  const reasons: { value: CancellationReason; label: string }[] = [
    { value: "too-expensive", label: "Too expensive" },
    { value: "not-using-enough", label: "I'm not using it enough" },
    { value: "missing-features", label: "Missing features I need" },
    { value: "technical-issues", label: "Technical issues" },
    { value: "switching-competitor", label: "Switching to a competitor" },
    { value: "other", label: "Other reason" },
  ];

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      const timeoutId = setTimeout(() => {
        console.log("Modal closed, resetting state");
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
      case "too-expensive":
        setCurrentStep("retention-offer");
        break;
      case "not-using-enough":
        setCurrentStep("pause-offer");
        break;
      case "missing-features":
        setCurrentStep("schedule-call");
        break;
      case "technical-issues":
        setCurrentStep("retention-offer");
        break;
      case "switching-competitor":
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
        if (selectedReason === "missing-features") {
          setCurrentStep("schedule-call");
        } else if (selectedReason === "not-using-enough") {
          setCurrentStep("pause-offer");
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

  if (currentStep === "reason") {
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
            Why do you want to cancel?
          </DialogTitle>
          <DialogDescription className="text-center text-base text-muted-foreground">
            Help us understand what we could improve
          </DialogDescription>
        </div>

        <div className="px-4 py-6 dark:bg-gray-900 sm:px-8">
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

            <div className="flex items-center justify-between border-t pt-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  if (currentStep === "retention-offer") {
    return (
      <RetentionOfferModal
        open={open}
        onOpenChange={onOpenChange}
        reason={selectedReason!}
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
        reason={selectedReason!}
        onBack={handleBack}
        onDecline={() => setCurrentStep("confirm")}
      />
    );
  }

  if (currentStep === "confirm") {
    return (
      <ConfirmCancellationModal
        open={open}
        onOpenChange={onOpenChange}
        onBack={handleBack}
        onClose={handleClose}
        reason={selectedReason!}
        feedback={feedback}
        onConfirm={() => {
          console.log(
            "Confirm cancellation onConfirm called, setting step to final-feedback",
          );
          setCurrentStep("final-feedback");
        }} // After confirming cancellation, show final feedback
      />
    );
  }

  if (currentStep === "feedback") {
    return (
      <FeedbackModal
        open={open}
        onOpenChange={onOpenChange}
        reason={selectedReason!}
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

  if (currentStep === "final-feedback") {
    console.log("Rendering final-feedback modal");
    return (
      <FeedbackModal
        open={open}
        onOpenChange={onOpenChange}
        reason={selectedReason!}
        feedback={feedback}
        onFeedbackChange={setFeedback}
        onBack={handleBack}
        onContinue={() => {
          // Final step - close modal after feedback
          console.log("Final feedback submitted, closing modal");
          onOpenChange(false);
        }}
        isFinalStep={true} // This is the final "Sorry to see you go" feedback
      />
    );
  }

  return null;
}
