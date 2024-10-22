import { useRouter } from "next/router";

import { useMemo, useState } from "react";
import React from "react";

import { useTeam } from "@/context/team-context";
import { CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import { useAnalytics } from "@/lib/analytics";
import { getStripe } from "@/lib/stripe/client";
import { PLANS } from "@/lib/stripe/utils";
import { usePlan } from "@/lib/swr/use-billing";
import { capitalize } from "@/lib/utils";

export default function UpgradePage() {
  const router = useRouter();
  const [period, setPeriod] = useState<"yearly" | "monthly">("yearly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null); // Track the clicked plan
  const teamInfo = useTeam();
  const { plan: teamPlan, trial, isCustomer, isOldAccount } = usePlan();
  const analytics = useAnalytics();

  const planFeatures = useMemo(
    () => ({
      Pro: {
        featureIntro: "Everything in Free, plus:",
        features: [
          "2 users included",
          "100 documents",
          "Unlimited links",
          "Custom branding",
          "Folder organization",
          "Require email verification",
          "More file types: pppt, docx, excel",
          "Papermark branding removed",
          "1-year analytics retention",
        ],
      },
      Business: {
        featureIntro: "Everything in Pro, plus:",
        features: [
          "3 users included",
          "1 dataroom",
          <span key="custom-dataroom">
            Custom domain <b>for documents</b>
          </span>,
          "Unlimited folder levels",
          "Unlimited documents",
          "Large file uploads",
          "Multi-file sharing",
          "Allow/Block list",
          "Dataroom branding",
          "More file types: dmg (cad)",
          "2-year analytics retention",
        ],
      },
      "Data Rooms": {
        featureIntro: "Everything in Business, plus:",
        features: [
          "3 users included",
          "Unlimited data rooms",
          <span key="custom-dataroom">
            Custom domain <b>for data rooms</b>
          </span>,
          "Advanced data rooms analytics",
          "NDA agreements",
          "Dynamic Watermark",
          "Granular user/group permissions",
          "Invite users directly from Papermark",
          "Audit log",
          "24h priority support",
          "Custom onboarding ",
        ],
      },
    }),
    [],
  );

  const plansToShow = ["Pro", "Business", "Data Rooms"];

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
          Annually <span className="text-[#fb7a00]">(Save up to 25%)</span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {plansToShow.map((planOption) => (
          <div
            key={planOption}
            className={`relative flex flex-col rounded-lg border ${
              planOption === "Business" ? "border-[#fb7a00]" : "border-gray-200"
            } bg-white p-6 shadow-sm dark:bg-gray-900`}
          >
            <div className="mb-4 border-b border-gray-200 pb-2">
              <h3 className="text-balance text-xl font-medium text-foreground text-gray-900 dark:text-white">
                Papermark {planOption}
              </h3>
              {planOption === "Business" && (
                <span className="absolute right-2 top-2 rounded bg-[#fb7a00] px-2 py-1 text-xs text-white">
                  Most popular
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

            <ul className="mb-4 mt-4 space-y-3 text-sm leading-6 text-gray-600 dark:text-muted-foreground">
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
                variant={planOption === "Business" ? "default" : "default"}
                className={`w-full py-2 text-sm ${
                  planOption === "Business"
                    ? "bg-[#fb7a00]/90 text-white hover:bg-[#fb7a00]"
                    : "bg-gray-800 text-white hover:bg-gray-900 dark:hover:bg-gray-700/80"
                }`}
                loading={selectedPlan === planOption} // Show loading only for the clicked plan
                disabled={selectedPlan !== null}
                onClick={() => {
                  setSelectedPlan(planOption); // Set the clicked plan
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
                        setSelectedPlan(null); // Reset loading state on error
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
                        setSelectedPlan(null); // Reset loading state on error
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

      <div className="mt-8 text-center">
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
