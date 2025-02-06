import { useRouter } from "next/router";

import { useMemo, useState } from "react";
import React from "react";

import { useTeam } from "@/context/team-context";
import { CheckIcon, Users2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useAnalytics } from "@/lib/analytics";
import { getStripe } from "@/lib/stripe/client";
import { PLANS } from "@/lib/stripe/utils";
import { usePlan } from "@/lib/swr/use-billing";
import { capitalize } from "@/lib/utils";

// First define the pricing data structure outside the component
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

export default function UpgradePage() {
  const router = useRouter();
  const [period, setPeriod] = useState<"yearly" | "monthly">("yearly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const teamInfo = useTeam();
  const { plan: teamPlan, trial, isCustomer, isOldAccount } = usePlan();
  const analytics = useAnalytics();

  const planFeatures = useMemo(
    () => ({
      Pro: {
        featureIntro: "Everything in Free, plus:",
        features: [
          <div
            key="users"
            className="flex items-center justify-between gap-x-8"
          >
            <div className="flex items-center gap-x-3">
              <CheckIcon className="h-6 w-5 flex-none text-[#fb7a00]" />
              <span>2 users included</span>
            </div>
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <Users2Icon className="h-4 w-4 text-gray-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{PLAN_PRICING.Pro.extraUserPrice[period]}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>,
          "100 documents",
          "Unlimited links",
          "Custom branding",
          "Folder organization",
          "Large file uploads",
          "Require email verification",
          "Video sharing and analytics",
          "More file types: pppt, docx, excel",
          "Papermark branding removed",
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
              <CheckIcon className="h-6 w-5 flex-none text-[#fb7a00]" />
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
          "1 dataroom",
          "1000 documents",
          <span key="custom-domain" className="flex items-center gap-x-3">
            <CheckIcon className="h-6 w-5 flex-none text-[#fb7a00]" />
            <span>
              Custom domain <b>for documents</b>
            </span>
          </span>,
          "Unlimited folder levels",

          "Multi-file sharing",
          "Screen shield/fence protection",
          "Allow/Block list",
          "Dataroom branding",
          "Webhooks",
          "More file types:  dwg, kml, zip",
          "2-year analytics retention",
        ],
      },
      "Data Rooms": {
        featureIntro: "Everything in Business, plus:",
        features: [
          <div
            key="users"
            className="flex items-center justify-between gap-x-8"
          >
            <div className="flex items-center gap-x-3">
              <CheckIcon className="h-6 w-5 flex-none text-[#fb7a00]" />
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
          <span key="custom-domain" className="flex items-center gap-x-3">
            <CheckIcon className="h-6 w-5 flex-none text-[#fb7a00]" />
            <span>
              One custom domain <b>for data rooms</b>
            </span>
          </span>,
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
              <CheckIcon className="h-6 w-5 flex-none text-[#fb7a00]" />
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

          <span key="custom-domain" className="flex items-center gap-x-3">
            <CheckIcon className="h-6 w-5 flex-none text-[#fb7a00]" />
            <span>
              <b>Unlimited</b> encrypted storage
            </span>
          </span>,
          "No file size limit",
          <span key="custom-domain" className="flex items-center gap-x-3">
            <CheckIcon className="h-6 w-5 flex-none text-[#fb7a00]" />
            <span>
              Unlimited custom domains <b>for data rooms</b>
            </span>
          </span>,
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
    [period],
  );

  const plansToShow = ["Pro", "Business", "Data Rooms", "Data Rooms Plus"];

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
        {plansToShow.map((planOption) => (
          <div
            key={planOption}
            className={`relative flex flex-col rounded-lg border ${
              planOption === "Business"
                ? "border-[#fb7a00]"
                : planOption === "Data Rooms Plus"
                  ? "border-gray-900"
                  : "border-gray-200"
            } bg-white p-6 shadow-sm dark:bg-gray-900`}
          >
            <div className="mb-4 border-b border-gray-200 pb-2">
              <h3 className="text-balance text-xl font-medium text-foreground text-gray-900 dark:text-white">
                Papermark {planOption}
              </h3>
              {(planOption === "Business" ||
                planOption === "Data Rooms Plus") && (
                <span
                  className={`absolute -top-3 right-4 rounded px-2 py-1 text-xs text-white ${
                    planOption === "Data Rooms Plus"
                      ? "bg-gray-900"
                      : "bg-[#fb7a00]"
                  }`}
                >
                  {planOption === "Data Rooms Plus"
                    ? "Best offer"
                    : "Most popular"}
                </span>
              )}
            </div>

            <div className="mb-2 text-balance text-4xl font-medium tabular-nums text-foreground">
              €{PLANS.find((p) => p.name === planOption)!.price[period].amount}
              <span className="text-base font-normal dark:text-white/75">
                /month
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-white">
              {
                planFeatures[planOption as keyof typeof planFeatures]
                  .featureIntro
              }
            </p>

            <ul
              role="list"
              className="mb-4 mt-4 space-y-3 text-sm leading-6 text-gray-600"
            >
              {planFeatures[
                planOption as keyof typeof planFeatures
              ].features.map((feature, i) => (
                <li key={i} className="flex items-center text-sm">
                  {typeof feature === "string" ? (
                    <>
                      <CheckIcon className="mr-3 h-5 w-5 flex-shrink-0 text-[#fb7a00]" />
                      <span>{feature}</span>
                    </>
                  ) : React.isValidElement(feature) ? (
                    feature
                  ) : (
                    feature
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <Button
                variant={planOption === "Business" ? "default" : "default"}
                className={`w-full py-2 text-sm ${
                  planOption === "Business"
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
                        PLANS.find((p) => p.name === planOption)!.price[period]
                          .priceIds[
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
                  : `Upgrade to ${planOption} ${capitalize(period)}`}
              </Button>
            </div>
          </div>
        ))}
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
