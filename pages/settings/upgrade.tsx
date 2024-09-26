import { useRouter } from "next/router";

import { useEffect, useMemo, useState } from "react";
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
  const [clicked, setClicked] = useState<boolean>(false);
  const teamInfo = useTeam();
  const { plan: teamPlan, trial } = usePlan();
  const analytics = useAnalytics();

  const planFeatures = useMemo(
    () => ({
      Pro: [
        "2 users included",
        "Custom branding",
        "Folder organization",
        "Unlimited links",
        "Unlimited documents",
        "Require email verification",
        "More file types: pppt, docx, excel",
        "Papermark branding removed",
        "1-year analytics retention",
      ],
      Business: [
        "3 users included",
        "1 dataroom",
        "Multi-file sharing",

        "Allow/Block list",
        <span key="custom-dataroom">
          Custom domain <b>for documents</b>
        </span>,
        "Custom social media cards",
        "Unlimited folder and subfolder levels",
        "Large file uploads",
        "More file types: .dmg for AutoCad",
        "2-year analytics retention",
      ],
      "Data Rooms": [
        "3 users included",
        "Unlimited data rooms",
        <span key="custom-dataroom">
          Custom domain <b>for data rooms</b>
        </span>,
        "NDA agreements",
        "Dynamic Watermarking",
        "Granular user/group permisssions",
        "Access Screen Customizatiion",
        "Advanced Data Rooms analytics",
        "24h priority support",
      ],
    }),
    [],
  );

  const plansToShow = ["Pro", "Business", "Data Rooms"];

  // Remove the useEffect hook that was causing the error

  return (
    <div className="min-h-screen bg-gray-50 p-8">
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
          Annually <span className="text-orange-500">(Save up to 25%)</span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {plansToShow.map((planOption) => (
          <div
            key={planOption}
            className={`relative flex flex-col rounded-lg border ${
              planOption === "Business"
                ? "border-orange-500"
                : "border-gray-200"
            } bg-white p-6 shadow-sm`}
          >
            <div className="mb-4 border-b border-gray-200 pb-2">
              <h3 className="text-balance text-xl font-medium text-foreground text-gray-900">
                Papermark {planOption}
              </h3>
              {planOption === "Business" && (
                <span className="absolute right-2 top-2 rounded bg-orange-500 px-2 py-1 text-xs text-white">
                  Most popular
                </span>
              )}
            </div>

            <div className="mb-6 text-balance text-4xl font-medium text-foreground">
              €{PLANS.find((p) => p.name === planOption)!.price[period].amount}
              <span className="text-base font-normal">/month</span>
            </div>
            <ul className="mb-8 mt-4 space-y-3 text-sm leading-6 text-gray-600 dark:text-muted-foreground">
              {planFeatures[planOption as keyof typeof planFeatures].map(
                (feature, i) => (
                  <li key={i} className="flex items-center text-sm">
                    <CheckIcon className="mr-3 h-5 w-5 flex-shrink-0 text-orange-500" />
                    <span>{feature}</span>
                  </li>
                ),
              )}
            </ul>
            <div className="mt-auto">
              <Button
                variant={planOption === "Business" ? "default" : "outline"}
                className={`w-full py-2 text-sm ${
                  planOption === "Business"
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-gray-800 text-white hover:bg-gray-900"
                }`}
                onClick={() => {
                  setClicked(true);
                  // @ts-ignore
                  // prettier-ignore

                  if (teamPlan !== "free") {
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
                        setClicked(false);
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
                        ]
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
                        const stripe = await getStripe();
                        stripe?.redirectToCheckout({ sessionId });
                      })
                      .catch((err) => {
                        alert(err);
                        setClicked(false);
                      });
                    }
                }}
              >{`Upgrade to ${planOption} ${capitalize(period)}`}</Button>
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
