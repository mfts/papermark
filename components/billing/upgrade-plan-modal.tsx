import Link from "next/link";
import { useRouter } from "next/router";

import React, { useEffect, useMemo, useState } from "react";

import { useTeam } from "@/context/team-context";
import { getStripe } from "@/ee/stripe/client";
import { Feature, PlanEnum, getPlanFeatures } from "@/ee/stripe/constants";
import { getPriceIdFromPlan } from "@/ee/stripe/functions/get-price-id-from-plan";
import { PLANS } from "@/ee/stripe/utils";
import { CheckIcon, Users2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useAnalytics } from "@/lib/analytics";
import { usePlan } from "@/lib/swr/use-billing";
import { capitalize, cn } from "@/lib/utils";

// Feature rendering component
const FeatureItem = ({ feature }: { feature: Feature }) => {
  const baseClasses = `flex items-center ${feature.isHighlighted ? "bg-orange-50 -mx-6 px-6 py-2 -my-1 font-bold rounded-md dark:bg-orange-900/20" : ""}`;

  if (feature.isUsers) {
    return (
      <div className={cn("justify-between gap-x-8", baseClasses)}>
        <div className="flex items-center gap-x-3">
          <CheckIcon className="h-5 w-5 flex-shrink-0 text-[#fb7a00]" />
          <span>{feature.text}</span>
        </div>
        {feature.tooltip && (
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <Users2Icon className="h-4 w-4 text-gray-500" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{feature.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  return (
    <div className={cn("text-sm", baseClasses)}>
      <CheckIcon className="mr-3 h-5 w-5 flex-shrink-0 text-[#fb7a00]" />
      <span>{feature.text}</span>
    </div>
  );
};

// Segmented control component for Base/Plus selection
const PlanSelector = ({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) => {
  return (
    <div className="mt-1 flex w-1/2 rounded-lg border border-gray-200 p-1">
      <button
        className={cn(
          "flex-1 rounded-md px-3 py-1 text-sm transition-colors",
          !value
            ? "bg-gray-300 text-foreground dark:bg-gray-600 dark:text-white"
            : "text-gray-600 hover:text-gray-900 dark:text-muted-foreground dark:hover:text-white",
        )}
        onClick={() => onChange(false)}
      >
        Base
      </button>
      <button
        className={cn(
          "flex-1 rounded-md px-3 py-1 text-sm transition-colors",
          value
            ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
            : "text-gray-600 hover:text-gray-900 dark:text-muted-foreground dark:hover:text-white",
        )}
        onClick={() => onChange(true)}
      >
        Plus
      </button>
    </div>
  );
};

export function UpgradePlanModal({
  clickedPlan,
  trigger,
  open,
  setOpen,
  children,
}: {
  clickedPlan: PlanEnum;
  trigger?: string;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [period, setPeriod] = useState<"yearly" | "monthly">("yearly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const { plan: teamPlan, isCustomer, isOldAccount } = usePlan();
  const analytics = useAnalytics();
  const [showDataRoomsPlus, setShowDataRoomsPlus] = useState(false);

  const plansToShow = useMemo(() => {
    switch (clickedPlan) {
      case PlanEnum.Pro:
        return [PlanEnum.Pro, PlanEnum.Business];
      case PlanEnum.Business:
        return [PlanEnum.Business, PlanEnum.DataRooms];
      case PlanEnum.DataRooms:
        return [PlanEnum.DataRooms, PlanEnum.DataRoomsPlus];
      case PlanEnum.DataRoomsPlus:
        return [PlanEnum.DataRooms, PlanEnum.DataRoomsPlus];
      default:
        return [PlanEnum.Pro, PlanEnum.Business];
    }
  }, [clickedPlan]);

  // Track analytics event when modal is opened
  useEffect(() => {
    if (open) {
      analytics.capture("Upgrade Button Clicked", {
        trigger: trigger,
        teamId,
      });
    } else {
      setShowDataRoomsPlus(false);
    }
  }, [open, trigger]);

  const handleUpgradeClick = () => {
    analytics.capture("Upgrade Button Clicked", {
      trigger: trigger,
      teamId,
    });
  };

  // If button is present, clone it and add onClick handler
  const buttonChild = React.isValidElement<{
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
  }>(children)
    ? React.cloneElement(children, { onClick: handleUpgradeClick })
    : children;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{buttonChild}</DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[900px] bg-gray-50 text-foreground dark:bg-gray-900 p-4">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center mb-4">
            <span className="mr-2 text-sm">Monthly</span>
            <Switch
              checked={period === "yearly"}
              onCheckedChange={() =>
                setPeriod(period === "monthly" ? "yearly" : "monthly")
              }
            />
            <span className="ml-2 text-sm">
              Annually <span className="text-[#fb7a00]">(Save up to 35%)</span>
            </span>
          </div>

          <div className="isolate grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
            {plansToShow.map((planOption) => {
              const planFeatures = getPlanFeatures(planOption, {
                period,
                showDataRoomsPlus:
                  planOption === PlanEnum.DataRooms && showDataRoomsPlus,
              });

              // Get the effective plan name for display
              const displayPlanName =
                planOption === PlanEnum.DataRooms && showDataRoomsPlus
                  ? PlanEnum.DataRoomsPlus
                  : planOption;

              const isDataRoomsUpgrade = plansToShow.includes(PlanEnum.DataRooms);

              return (
                <div
                  key={displayPlanName}
                  className={`relative flex flex-col rounded-lg border ${
                    planOption === PlanEnum.Business
                      ? "border-[#fb7a00]"
                      : planOption === PlanEnum.DataRoomsPlus &&
                        isDataRoomsUpgrade
                      ? "border-gray-900"
                      : "border-gray-200"
                  } bg-white p-4 shadow-sm dark:bg-gray-900`}
                >
                <div className="mb-4 border-b border-gray-200 pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-balance text-xl font-medium text-gray-900 dark:text-white">
                      Papermark {displayPlanName}
                    </h3>
                  </div>
                  <span
                    className={cn(
                      "absolute right-2 top-2 rounded px-2 py-1 text-xs text-white",
                      planOption === PlanEnum.Business && "bg-[#fb7a00]",
                      displayPlanName === PlanEnum.DataRoomsPlus &&
                      "bg-gray-900 dark:bg-gray-100 dark:text-gray-900",
                    )}
                  >
                    {planOption === PlanEnum.Business && "Most popular"}
                    {displayPlanName === PlanEnum.DataRoomsPlus && "Best deal"}
                  </span>
                </div>

                <div className="mb-2">
                  <span className="text-balance text-4xl font-medium tabular-nums text-gray-900 dark:text-white">
                    €
                    {
                      PLANS.find((p) => p.name === displayPlanName)?.price[
                        period
                      ].amount
                    }
                  </span>
                  <span className="text-gray-500 dark:text-white/75">
                    /month
                  </span>
                </div>

                {planOption === PlanEnum.DataRooms &&
                  isDataRoomsUpgrade &&
                  !plansToShow.includes(PlanEnum.DataRoomsPlus) && (
                    <PlanSelector
                      value={showDataRoomsPlus}
                      onChange={setShowDataRoomsPlus}
                    />
                  )}

                <p className="mt-4 text-sm text-gray-600 dark:text-white">
                  {planFeatures.featureIntro}
                </p>

                <ul className="mb-6 mt-2 space-y-2 text-sm leading-6 text-gray-600 dark:text-muted-foreground">
                  {planFeatures.features.map((feature, i) => (
                    <li key={i}>
                      <FeatureItem feature={feature} />
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <Button
                    variant={
                      planOption === PlanEnum.Business ? "default" : "outline"
                    }
                    className={`w-full py-2 text-sm ${
                      planOption === PlanEnum.Business
                        ? "bg-[#fb7a00]/90 text-white hover:bg-[#fb7a00]"
                        : "bg-gray-800 text-white hover:bg-gray-900 hover:text-white dark:hover:bg-gray-700/80"
                      }`}
                    loading={selectedPlan === planOption}
                    disabled={selectedPlan !== null}
                    onClick={() => {
                      const priceId = getPriceIdFromPlan(
                        displayPlanName,
                        period,
                      );

                      setSelectedPlan(planOption);
                      if (isCustomer && teamPlan !== "free") {
                        fetch(`/api/teams/${teamId}/billing/manage`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            priceId,
                            upgradePlan: true,
                          }),
                        })
                          .then(async (res) => {
                            const url = await res.json();
                            router.push(url);
                          })
                          .catch((err) => {
                            alert(err);
                            setSelectedPlan(null);
                          });
                      } else {
                        fetch(
                          `/api/teams/${teamId}/billing/upgrade?priceId=${
                            priceId
                          }`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                          },
                        )
                          .then(async (res) => {
                            const data = await res.json();
                            const { id: sessionId } = data;
                            const stripe = await getStripe(isOldAccount);
                            stripe?.redirectToCheckout({ sessionId });
                          })
                          .catch((err) => {
                            alert(err);
                            setSelectedPlan(null);
                          });
                      }
                    }}
                  >
                    {selectedPlan === planOption
                      ? "Redirecting to Stripe..."
                      : `Upgrade to ${displayPlanName} ${capitalize(period)}`}
                  </Button>
                </div>
              </div>
            );
          })}
          </div>
        </div>
        <div className="flex flex-col items-center text-center text-sm text-muted-foreground mt-1">
          All plans include unlimited viewers and page by page document
          analytics.
          <Link
            href="/settings/upgrade"
            className="underline underline-offset-4 hover:text-foreground"
          >
            See all plans
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}