import Link from "next/link";
import { useRouter } from "next/router";

import { useEffect, useMemo, useState } from "react";
import React from "react";

import { useTeam } from "@/context/team-context";
import { getStripe } from "@/ee/stripe/client";
import { PLANS } from "@/ee/stripe/utils";
import {
  CheckIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  Users2Icon,
} from "lucide-react";

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
import { capitalize } from "@/lib/utils";

// Add the PLAN_PRICING constant
const PLAN_PRICING = {
  Pro: {
    extraUserPrice: {
      monthly: "€19/month per additional user",
      yearly: "€14/month per additional user",
    },
  },
  Business: {
    extraUserPrice: {
      monthly: "€26/month per additional user",
      yearly: "€19/month per additional user",
    },
  },
  "Data Rooms": {
    extraUserPrice: {
      monthly: "€49/month per additional user",
      yearly: "€33/month per additional user",
    },
  },
  "Data Rooms Plus": {
    extraUserPrice: {
      monthly: "€79/month per additional user",
      yearly: "€49/month per additional user",
    },
  },
};

export enum PlanEnum {
  Pro = "Pro",
  Business = "Business",
  DataRooms = "Data Rooms",
  DataRoomsPlus = "Data Rooms Plus",
}
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
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null); // Track the clicked plan
  const teamInfo = useTeam();
  const { plan: teamPlan, trial, isCustomer, isOldAccount } = usePlan();
  const analytics = useAnalytics();
  const [showDataRoomsPlus, setShowDataRoomsPlus] = useState(false);

  const planFeatures = useMemo(
    () => ({
      Pro: {
        featureIntro: "Everything in Free, plus:",
        features: [
          "1 user included",
          "300 documents",
          "Unlimited links",
          <div key="custom-domain" className="flex items-center gap-x-3">
            <span>
              Custom domain <b>for documents</b>
            </span>
          </div>,
          "Folder organization",
          "Large file uploads",
          "Video sharing and analytics",
          // "Require email verification",
          "More file types: ppt, docx, excel",
          "Remove Papermark branding",
          "1-year analytics retention",
        ],
      },
      Business: {
        featureIntro: "Everything in Pro, plus:",
        features: [
          <div
            key="users"
            className="flex items-center justify-between gap-x-8"
          >
            <div className="flex items-center gap-x-3">
              <span>3 users included</span>
            </div>
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <Users2Icon className="h-4 w-4 text-gray-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{PLAN_PRICING.Business.extraUserPrice[period]}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>,
          "Unlimited data rooms",
          "1000 documents",
          <div key="custom-domain" className="flex items-center gap-x-3">
            <span>
              Custom domain <b>for documents</b>
            </span>
          </div>,
          "Unlimited folder levels",
          "Multi-file sharing",
          "Screen shield/fence protection",
          "Require email verification",
          "Allow/Block list",
          "Dataroom branding",
          "Webhooks",
          "More file types: dwg, kml, zip",
          "2-year analytics retention",
        ],
      },
      "Data Rooms": {
        featureIntro: "Everything in Business, plus:",
        features: showDataRoomsPlus
          ? [
              <div
                key="users"
                className="flex items-center justify-between gap-x-8"
              >
                <div className="flex items-center gap-x-3">
                  <span>5 users included</span>
                </div>
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <Users2Icon className="h-4 w-4 text-gray-500" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {PLAN_PRICING["Data Rooms Plus"].extraUserPrice[period]}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>,
              <div key="storage" className="flex items-center gap-x-3">
                <span>
                  <b>Unlimited</b> encrypted storage
                </span>
              </div>,
              "No file size limit",
              <div key="custom-domain" className="flex items-center gap-x-3">
                <span>
                  Unlimited custom domains <b>for data rooms</b>
                </span>
              </div>,
              "Q&A module with custom permissions",
              "Automatic file indexing",
              "Assign users to particular data room",
              "Email invite viewers directly from Papermark",
              "White-labeling",
              "Dedicated account manager",
              "3-year analytics retention",
            ]
          : [
              <div
                key="users"
                className="flex items-center justify-between gap-x-8"
              >
                <div className="flex items-center gap-x-3">
                  <span>3 users included</span>
                </div>
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <Users2Icon className="h-4 w-4 text-gray-500" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{PLAN_PRICING["Data Rooms"].extraUserPrice[period]}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>,
              "Unlimited data rooms",
              "Unlimited documents",
              <div key="custom-domain" className="flex items-center gap-x-3">
                <span>
                  Custom domain <b>for data rooms</b>
                </span>
              </div>,
              "Data rooms analytics",
              "NDA agreements",
              "Dynamic watermark",
              "Granular user/group permissions",
              "Audit log for viewers",
              "24h priority support",
              "Custom onboarding",
              "2-year analytics retention",
            ],
      },
      "Data Rooms Plus": {
        featureIntro: "Everything in Data Rooms, plus:",
        features: [
          <div
            key="users"
            className="flex items-center justify-between gap-x-8"
          >
            <div className="flex items-center gap-x-3">
              <span>5 users included</span>
            </div>
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <Users2Icon className="h-4 w-4 text-gray-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {PLAN_PRICING["Data Rooms Plus"].extraUserPrice[period]}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>,
          <div key="storage" className="flex items-center gap-x-3">
            <span>
              <b>Unlimited</b> encrypted storage
            </span>
          </div>,
          "No file size limit",
          <div key="custom-domain" className="flex items-center gap-x-3">
            <span>
              Unlimited custom domains <b>for data rooms</b>
            </span>
          </div>,
          "Q&A module with custom permissions",
          "Automatic file indexing",
          "Assign users to particular data room",
          "Email invite viewers directly from Papermark",
          "White-labeling",
          "Dedicated account manager",
          "3-year analytics retention",
        ],
      },
    }),
    [period, showDataRoomsPlus],
  );

  const plansToShow = useMemo(() => {
    switch (clickedPlan) {
      case "Pro":
        return ["Pro", "Business"];
      case "Business":
        return ["Business", "Data Rooms"];
      case "Data Rooms":
        return ["Data Rooms", "Data Rooms Plus"];
      case "Data Rooms Plus":
        return ["Data Rooms", "Data Rooms Plus"];
      default:
        return ["Pro", "Business"];
    }
  }, [clickedPlan]);

  // Update this to check for Data Rooms plans
  const isDataRoomsPlans = useMemo(
    () => plansToShow.every((plan) => plan.includes("Data Rooms")),
    [plansToShow],
  );

  // Track analytics event when modal is opened
  useEffect(() => {
    if (open) {
      analytics.capture("Upgrade Button Clicked", {
        trigger: trigger,
        teamId: teamInfo?.currentTeam?.id,
      });
    }
  }, [open, trigger]);

  const handleUpgradeClick = () => {
    analytics.capture("Upgrade Button Clicked", {
      trigger: trigger,
      teamId: teamInfo?.currentTeam?.id,
    });
  };

  // If button is present, clone it and add onClick handler
  const buttonChild = React.isValidElement<{
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
  }>(children)
    ? React.cloneElement(children, { onClick: handleUpgradeClick })
    : children;

  // Add this helper function to get the correct plan name for button and pricing
  const getEffectivePlanName = (planOption: string) => {
    if (planOption === "Data Rooms" && showDataRoomsPlus) {
      return "Data Rooms Plus";
    }
    return planOption;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{buttonChild}</DialogTrigger>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto bg-gray-50 text-foreground dark:bg-gray-900"
        style={{
          width: "90vw",
          maxWidth: "900px",
        }}
      >
        <div className="flex items-center justify-center">
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

        <div className="isolate grid grid-cols-1 gap-4 overflow-hidden rounded-xl p-4 md:grid-cols-2">
          {plansToShow.map((planOption) => (
            <div
              key={planOption}
              className={`relative flex flex-col rounded-lg border ${
                planOption === "Business" && plansToShow.includes("Data Rooms")
                  ? "border-[#fb7a00]"
                  : planOption === "Data Rooms Plus" &&
                      plansToShow.includes("Data Rooms")
                    ? "border-gray-900"
                    : "border-gray-200"
              } bg-white p-6 shadow-sm dark:bg-gray-900`}
            >
              <div className="mb-4 border-b border-gray-200 pb-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-balance text-xl font-medium text-gray-900 dark:text-white">
                    Papermark{" "}
                    {showDataRoomsPlus &&
                    planOption === "Data Rooms" &&
                    plansToShow.includes("Business")
                      ? "Data Rooms Plus"
                      : planOption}
                  </h3>
                  {planOption === "Data Rooms" &&
                    plansToShow.includes("Business") && (
                      <button
                        onClick={() => setShowDataRoomsPlus(!showDataRoomsPlus)}
                        className="focus:outline-none"
                      >
                        {showDataRoomsPlus ? (
                          <MinusCircleIcon className="h-6 w-6 text-[#fb7a00] hover:text-[#fb7a00]/90" />
                        ) : (
                          <PlusCircleIcon className="h-6 w-6 text-[#fb7a00] hover:text-[#fb7a00]/90" />
                        )}
                      </button>
                    )}
                </div>
                {((planOption === "Business" &&
                  plansToShow.includes("Data Rooms")) ||
                  (planOption === "Data Rooms Plus" &&
                    plansToShow.includes("Data Rooms"))) && (
                  <span
                    className={`absolute right-2 top-2 rounded px-2 py-1 text-xs text-white ${
                      planOption === "Data Rooms Plus"
                        ? "bg-gray-900"
                        : "bg-[#fb7a00]"
                    }`}
                  >
                    {planOption === "Data Rooms Plus"
                      ? "Best deal"
                      : "Most popular"}
                  </span>
                )}
              </div>

              {/* Update pricing section */}
              <div className="mb-2">
                <span className="text-balance text-4xl font-medium tabular-nums text-gray-900 dark:text-white">
                  €
                  {
                    PLANS.find(
                      (p) => p.name === getEffectivePlanName(planOption),
                    )?.price[period].amount
                  }
                </span>
                <span className="text-gray-500 dark:text-white/75">/month</span>
              </div>

              <p className="mt-4 text-sm text-gray-600 dark:text-white">
                {
                  planFeatures[planOption as keyof typeof planFeatures]
                    .featureIntro
                }
              </p>

              <ul className="mb-6 mt-2 space-y-2 text-sm leading-6 text-gray-600 dark:text-muted-foreground">
                {planFeatures[
                  planOption as keyof typeof planFeatures
                ].features.map((feature, i) => (
                  <li key={i} className="flex items-center text-sm">
                    <CheckIcon className="mr-3 h-5 w-5 flex-shrink-0 text-[#fb7a00]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <Button
                  variant={planOption === "Business" ? "default" : "outline"}
                  className={`w-full py-2 text-sm ${
                    planOption === "Business"
                      ? "bg-[#fb7a00]/90 text-white hover:bg-[#fb7a00]"
                      : "bg-gray-800 text-white hover:bg-gray-900 hover:text-white dark:hover:bg-gray-700/80"
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
                          const url = await res.json();
                          router.push(url);
                        })
                        .catch((err) => {
                          alert(err);
                          setSelectedPlan(null);
                        });
                    } else {
                      fetch(
                        `/api/teams/${teamInfo?.currentTeam?.id}/billing/upgrade?priceId=${
                          PLANS.find(
                            (p) => p.name === getEffectivePlanName(planOption),
                          )!.price[period].priceIds[
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
                    : `Upgrade to ${getEffectivePlanName(planOption)} ${capitalize(period)}`}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link
            href="/settings/upgrade"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            See all plans. All plans include unlimited viewers and page by page
            document analytics.
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
