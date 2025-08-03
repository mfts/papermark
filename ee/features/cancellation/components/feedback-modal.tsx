"use client";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";

type CancellationReason =
  | "too-expensive"
  | "not-using-enough"
  | "missing-features"
  | "technical-issues"
  | "switching-competitor"
  | "other";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: CancellationReason;
  feedback: string;
  onFeedbackChange: (feedback: string) => void;
  onBack: () => void;
  onContinue: () => void;
  isFinalStep?: boolean;
}

export function FeedbackModal({
  open,
  onOpenChange,
  reason,
  feedback,
  onFeedbackChange,
  onBack,
  onContinue,
  isFinalStep = false,
}: FeedbackModalProps) {
  const getTitle = () => {
    if (isFinalStep) {
      return "Sorry to see you go";
    }

    switch (reason) {
      case "too-expensive":
        return "Tell us about pricing";
      case "not-using-enough":
        return "Help us understand your usage";
      case "missing-features":
        return "What features do you need?";
      case "technical-issues":
        return "Tell us about the issues";
      case "switching-competitor":
        return "What's driving your decision?";
      case "other":
        return "Tell us more";
      default:
        return "Help us understand what we could improve";
    }
  };

  const getSubtitle = () => {
    if (isFinalStep) {
      return "Please share the main reason for your cancellation to help us improve";
    }

    switch (reason) {
      case "too-expensive":
        return "What would make the pricing work better for your budget?";
      case "not-using-enough":
        return "Help us understand how we can make Papermark more valuable for your workflow.";
      case "missing-features":
        return "What features are you missing? This helps us prioritize our roadmap.";
      case "technical-issues":
        return "What technical problems have you encountered? We'd love to help resolve them.";
      case "switching-competitor":
        return "What does the competitor offer that we don't? This helps us improve.";
      case "other":
        return "We'd love to hear your specific feedback.";
      default:
        return "Help us understand what we could improve";
    }
  };

  const getPlaceholder = () => {
    if (isFinalStep) {
      return "Please tell us the main reason you decided to cancel your subscription...";
    }

    switch (reason) {
      case "too-expensive":
        return "Tell us about your budget constraints or what pricing would work...";
      case "not-using-enough":
        return "Share how you use Papermark and what would make it more valuable...";
      case "missing-features":
        return "Tell us about the features you need...";
      case "technical-issues":
        return "Describe the technical problems you've experienced...";
      case "switching-competitor":
        return "Tell us about the competitor and what attracted you to them...";
      case "other":
        return "Share your thoughts...";
      default:
        return "Help us understand what we could improve...";
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
          <Textarea
            placeholder={getPlaceholder()}
            value={feedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            rows={6}
            className="resize-none bg-white dark:bg-gray-800"
          />

          <div className="flex items-center justify-between border-t pt-4">
            {!isFinalStep && (
              <Button
                variant="ghost"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            {isFinalStep && <div />} {/* Spacer for final step */}
            <Button
              onClick={onContinue}
              className="bg-gray-900 hover:bg-gray-800"
            >
              {isFinalStep ? "Submit" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
