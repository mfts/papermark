"use client";

import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { PLANS } from "@/ee/stripe/utils";
import { toast } from "sonner";
import { mutate } from "swr";

import { usePlan } from "@/lib/swr/use-billing";
import useLimits from "@/lib/swr/use-limits";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CancellationReason } from "../lib/constants";
import { CancellationBaseModal } from "./reason-base-modal";

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
  const { currentTeamId } = useTeam();
  const router = useRouter();
  const { plan: userPlan, isAnnualPlan } = usePlan();
  const { limits } = useLimits();

  const currentQuantity = limits?.users ?? 1;

  const calculateSavings = () => {
    // Find current plan pricing
    const currentPlan = PLANS.find((p) => p.slug === userPlan);
    if (!currentPlan) return { savings: "€0" };

    const monthlyPrice = currentPlan.price.monthly.unitPrice;
    const yearlyPrice = currentPlan.price.yearly.unitPrice;

    // Simple logic: 50% discount for 3 months (monthly) or 12 months (annual)
    const discountPercent = 0.5;
    const durationMonths = isAnnualPlan ? 12 : 3;
    const basePrice = isAnnualPlan ? yearlyPrice : monthlyPrice;

    // Calculate savings
    const totalSavings = Math.round(
      (basePrice * durationMonths * discountPercent * currentQuantity) / 100,
    );

    return { savings: `€${totalSavings}` };
  };

  const getOfferDetails = () => {
    const { savings } = calculateSavings();

    if (isAnnualPlan) {
      return {
        title: "Special offer just for you",
        subtitle: "Let us make this work for your budget",
        discount: "50% off your next year",
        savings,
        duration: "12 months",
      };
    } else {
      return {
        title: "Special offer just for you",
        subtitle: "Let us make this work for your budget",
        discount: "50% off for the next 3 months",
        savings,
        duration: "3 months",
      };
    }
  };

  const offerDetails = getOfferDetails();

  const handleAcceptOffer = async () => {
    if (!currentTeamId) return;

    setLoading(true);

    await fetch(`/api/teams/${currentTeamId}/billing/retention-offer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isAnnualPlan,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (data.success) {
          mutate(`/api/teams/${currentTeamId}/billing/plan`);
          mutate(`/api/teams/${currentTeamId}/billing/plan?withDiscount=true`);
          onClose();
          toast.success(
            `50% discount applied for ${isAnnualPlan ? "12 months" : "3 months"}!`,
          );
        }
      })
      .catch((err) => {
        toast.error("Something went wrong");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <CancellationBaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={offerDetails.title}
      description={offerDetails.subtitle}
      showKeepButton={true}
      // onBack={onBack}
      onDecline={onDecline}
    >
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
        <h3 className="mb-2 text-xl font-semibold">{offerDetails.discount}</h3>
      </div>

      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <div className="mb-2 text-2xl font-bold text-green-800">
          You save {offerDetails.savings}
        </div>
        <div className="text-sm font-medium text-green-700">
          Over {offerDetails.duration}
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
    </CancellationBaseModal>
  );
}
