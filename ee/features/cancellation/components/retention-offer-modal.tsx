"use client";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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

interface RetentionOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: CancellationReason;
  onBack: () => void;
  onDecline: () => void;
  onClose: () => void;
}

export function RetentionOfferModal({
  open,
  onOpenChange,
  reason,
  onBack,
  onDecline,
  onClose,
}: RetentionOfferModalProps) {
  const [loading, setLoading] = useState(false);
  const teamInfo = useTeam();

  const getOfferDetails = () => {
    switch (reason) {
      case "too-expensive":
      case "switching-competitor":
        return {
          title: "We hear you on the price",
          subtitle: "Let us make this work for your budget",
          discount: "25% off for 3 months",
          savings: "€63",
          monthlyDiscount: "€21/month",
          duration: "over 3 months",
        };
      case "technical-issues":
        return {
          title: "Let us help you succeed",
          subtitle: "50% off plus dedicated onboarding support",
          discount: "50% off for 2 months + onboarding call",
          savings: "€170",
          monthlyDiscount: "€85/month",
          duration: "over 2 months + free onboarding",
        };
      default:
        return {
          title: "Let's make this work",
          subtitle: "25% off plus a call to address your specific needs",
          discount: "25% off for 2 months + consultation call",
          savings: "€42",
          monthlyDiscount: "€21/month",
          duration: "over 2 months + consultation call",
        };
    }
  };

  const offerDetails = getOfferDetails();

  const handleAcceptOffer = async () => {
    if (!teamInfo?.currentTeam?.id) {
      toast.error("Team information not found");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${teamInfo.currentTeam.id}/billing/retention-offer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason,
            offerType: "discount",
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to apply retention offer");
      }

      const data = await response.json();

      toast.success("Offer applied successfully!");
      onClose();

      // Refresh the page to show updated billing status
      window.location.reload();
    } catch (error) {
      console.error("Error applying retention offer:", error);
      toast.error("Failed to apply offer. Please try again.");
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
          {offerDetails.title}
        </DialogTitle>
        <DialogDescription className="text-center text-base text-muted-foreground">
          {offerDetails.subtitle}
        </DialogDescription>
      </div>

      <div className="bg-muted px-4 py-8 dark:bg-gray-900 sm:px-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Badge
              variant="secondary"
              className="border-blue-200 bg-blue-50 text-blue-700"
            >
              Special offer
            </Badge>
            <span className="text-sm text-muted-foreground">Limited time</span>
          </div>

          <div className="text-center">
            <h3 className="mb-2 text-xl font-semibold">
              {offerDetails.discount}
            </h3>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="mb-1 text-lg font-semibold text-green-800">
              You save {offerDetails.savings}
            </div>
            <div className="text-sm text-green-700">
              Save {offerDetails.monthlyDiscount} • {offerDetails.duration}
            </div>
          </div>

          <Button
            onClick={handleAcceptOffer}
            className="w-full"
            size="lg"
            loading={loading}
          >
            Accept this offer
          </Button>

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
