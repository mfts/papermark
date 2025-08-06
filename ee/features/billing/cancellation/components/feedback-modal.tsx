"use client";

import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { CancellationReason } from "../lib/constants";
import { CancellationBaseModal } from "./reason-base-modal";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: CancellationReason;
  feedback: string;
  onFeedbackChange: (feedback: string) => void;
  onBack?: () => void;
  onContinue: () => void;
  isFinalStep?: boolean;
  loading?: boolean;
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
  loading = false,
}: FeedbackModalProps) {
  const getTitle = () => {
    if (isFinalStep) {
      return "Sorry to see you go!";
    }

    switch (reason) {
      case "too_expensive":
        return "Tell us about pricing";
      case "unused":
        return "Help us understand your usage";
      case "missing_features":
        return "What features do you need?";
      case "switched_service":
        return "What's driving your decision?";
      case "other":
        return "Tell us more";
      default:
        return "Help us understand what we could improve";
    }
  };

  const getSubtitle = () => {
    if (isFinalStep) {
      return "Please share your feedback to help us improve";
    }

    switch (reason) {
      case "too_expensive":
        return "What would make the pricing work better for your budget?";
      case "unused":
        return "Help us understand how we can make Papermark more valuable for your workflow.";
      case "missing_features":
        return "What features are you missing? This helps us prioritize our roadmap.";
      case "switched_service":
        return "What does the competitor offer that we don't? This helps us improve.";
      case "other":
        return "We'd love to hear your specific feedback.";
      default:
        return "Help us understand what we could improve";
    }
  };

  const getPlaceholder = () => {
    if (isFinalStep) {
      return "Help us understand what we could improve...";
    }

    switch (reason) {
      case "too_expensive":
        return "Tell us about your budget constraints or what pricing would work...";
      case "unused":
        return "Share how you use Papermark and what would make it more valuable...";
      case "missing_features":
        return "Tell us about the features you need...";
      case "switched_service":
        return "Tell us about the competitor and what attracted you to them...";
      case "other":
        return "Share your thoughts...";
      default:
        return "Help us understand what we could improve...";
    }
  };

  const cancelButton = (isFinalStep: boolean) => {
    if (isFinalStep) {
      return null;
    } else {
      return (
        <Button
          variant="ghost"
          onClick={() => onOpenChange(false)}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </Button>
      );
    }
  };

  const proceedButton = (isFinalStep: boolean) => {
    if (isFinalStep) {
      return (
        <Button className="ml-auto" onClick={onContinue} loading={loading}>
          Submit
        </Button>
      );
    } else {
      return <Button onClick={onContinue}>Submit</Button>;
    }
  };

  return (
    <CancellationBaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={getTitle()}
      description={getSubtitle()}
      cancelButton={cancelButton(isFinalStep)}
      proceedButton={proceedButton(isFinalStep)}
    >
      <Textarea
        placeholder={getPlaceholder()}
        value={feedback}
        onChange={(e) => onFeedbackChange(e.target.value)}
        rows={6}
        className="resize-none bg-white dark:bg-gray-800"
      />
    </CancellationBaseModal>
  );
}
