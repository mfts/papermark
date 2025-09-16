import { useRouter } from "next/router";

import { useMemo, useState } from "react";
import React from "react";

import { useTeam } from "@/context/team-context";
import { getStripe } from "@/ee/stripe/client";
import { Feature, PlanEnum, getPlanFeatures } from "@/ee/stripe/constants";
import { PLANS } from "@/ee/stripe/utils";
import { CheckIcon, Users2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { useAnalytics } from "@/lib/analytics";
import { usePlan } from "@/lib/swr/use-billing";
import { capitalize } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Feature rendering component
const FeatureItem = ({
  feature,
  period,
}: {
  feature: Feature;
  period: "monthly" | "yearly";
}) => {
  const baseClasses = `flex items-center ${feature.isHighlighted ? "bg-orange-50 -mx-6 px-6 py-2 rounded-md dark:bg-orange-900/20" : ""}`;

  if (feature.isUsers) {
    return (
      <div className={`justify-between gap-x-8 ${baseClasses}`}>
        <div className="flex items-center gap-x-3">
          {feature.isNotIncluded ? (
            <XIcon className="h-6 w-5 flex-none text-gray-500" />
          ) : (
            <CheckIcon className="h-6 w-5 flex-none text-[#fb7a00]" />
          )}
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

  if (feature.isCustomDomain) {
    return (
      <span className={`gap-x-3 ${baseClasses}`}>
        {feature.isNotIncluded ? (
          <XIcon className="h-6 w-5 flex-none text-gray-500" />
        ) : (
          <CheckIcon className="h-6 w-5 flex-none text-[#fb7a00]" />
        )}
        <span>{feature.text}</span>
      </span>
    );
  }

  return (
    <div className={`gap-x-3 ${baseClasses}`}>
      {feature.isNotIncluded ? (
        <XIcon className="h-6 w-5 flex-none text-gray-500" />
      ) : (
        <CheckIcon className="h-6 w-5 flex-none text-[#fb7a00]" />
      )}
      <span>{feature.text}</span>
    </div>
  );
};

export default function UpgradePage() {
  const router = useRouter();
  const [period, setPeriod] = useState<"yearly" | "monthly">("yearly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const teamInfo = useTeam();
  const { plan: teamPlan, trial, isCustomer, isOldAccount } = usePlan();
  const analytics = useAnalytics();

  const plansToShow = [
    PlanEnum.Pro,
    PlanEnum.Business,
    PlanEnum.DataRooms,
    PlanEnum.DataRoomsPlus,
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
      <h1 className="mb-8 text-center text-3xl font-bold">
        Select best plan for your business
      </h1>

      <div className="mb-8 flex items-center justify-center">
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

      <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
        {plansToShow.map((planOption) => {
          const planFeatures = getPlanFeatures(planOption, { period });

          return (
            <div
              key={planOption}
              className={`relative flex flex-col rounded-lg border ${
                planOption === PlanEnum.Business
                  ? "border-[#fb7a00]"
                  : planOption === PlanEnum.DataRoomsPlus
                    ? "border-gray-900 dark:border-gray-200"
                    : "border-gray-400"
              } bg-white p-6 shadow-sm dark:bg-gray-900`}
            >
              <div className="mb-4 border-b border-gray-200 pb-2">
                <h3 className="text-balance text-xl font-medium text-foreground text-gray-900 dark:text-white">
                  Papermark {planOption}
                </h3>
                {(planOption === PlanEnum.Business ||
                  planOption === PlanEnum.DataRoomsPlus) && (
                  <span
                    className={`absolute -top-3 right-4 rounded px-2 py-1 text-xs text-white ${
                      planOption === PlanEnum.DataRoomsPlus
                        ? "bg-gray-900 dark:bg-gray-100 dark:text-black"
                        : "bg-[#fb7a00]"
                    }`}
                  >
                    {planOption === PlanEnum.DataRoomsPlus
                      ? "Best offer"
                      : "Most popular"}
                  </span>
                )}
              </div>

              <div className="mb-2 text-balance text-4xl font-medium tabular-nums text-foreground">
                €
                {PLANS.find((p) => p.name === planOption)!.price[period].amount}
                <span className="text-base font-normal dark:text-white/75">
                  /month
                </span>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-white">
                {planFeatures.featureIntro}
              </p>

              <ul
                role="list"
                className="mb-4 mt-4 space-y-3 text-sm leading-6 text-gray-600"
              >
                {planFeatures.features.map((feature, i) => (
                  <li key={i}>
                    <FeatureItem feature={feature} period={period} />
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Button
                  variant={
                    planOption === PlanEnum.Business ? "default" : "default"
                  }
                  className={`w-full py-2 text-sm ${
                    planOption === PlanEnum.Business
                      ? "bg-[#fb7a00]/90 text-white hover:bg-[#fb7a00]"
                      : "bg-gray-800 text-white hover:bg-gray-900 dark:hover:bg-gray-700/80"
                  }`}
                  loading={selectedPlan === planOption}
                  disabled={selectedPlan !== null}
                  onClick={() => {
                    setSelectedPlan(planOption);
                    if (isCustomer && teamPlan !== "free") {
                      fetch(
                        `/api/teams/${teamInfo?.currentTeam?.id}/billing/manage`,
                        {
                          method: "POST",
                        },
                      )
                        .then(async (res) => {
                          if (res.status === 429) {
                            toast.error(
                              "Rate limit exceeded. Please try again later.",
                            );
                            setSelectedPlan(null);
                            return;
                          }

                          const url = await res.json();
                          router.push(url);
                        })
                        .catch((err) => {
                          alert(err);
                          setSelectedPlan(null);
                        });
                    } else {
                      fetch(
                        `/api/teams/${
                          teamInfo?.currentTeam?.id
                        }/billing/upgrade?priceId=${
                          PLANS.find((p) => p.name === planOption)!.price[
                            period
                          ].priceIds[
                            process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
                              ? "production"
                              : "test"
                          ][isOldAccount ? "old" : "new"]
                        }`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                        },
                      )
                        .then(async (res) => {
                          if (res.status === 429) {
                            toast.error(
                              "Rate limit exceeded. Please try again later.",
                            );
                            setSelectedPlan(null);
                            return;
                          }

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
                    : `Upgrade to ${planOption} ${capitalize(period)}`}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col items-center space-y-2">
        <a
          target="_blank"
          className="text-sm text-muted-foreground underline-offset-4"
        >
          All plans include unlimited viewers and page by page document
          analytics.
        </a>
        <a
          href="https://cal.com/marcseitz/papermark"
          target="_blank"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Looking for Papermark Enterprise?
        </a>
      </div>
    </div>
  );
}
