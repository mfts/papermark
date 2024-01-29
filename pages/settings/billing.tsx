import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import AppLayout from "@/components/layouts/app";
import Navbar from "@/components/settings/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTeam } from "@/context/team-context";
import { useBilling } from "@/lib/swr/use-billing";
import { cn, formattedDate, getFirstAndLastDay } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Tier {
  id: number;
  title: string;
  priceMonthly: string;
  currentPlan: boolean;
  hasPlan: boolean;
  isTrial?: boolean;
  description: string;
  features: string[];
}

export default function Billing() {
  const router = useRouter();
  const { plan, startsAt, endsAt } = useBilling();
  const [clicked, setClicked] = useState<boolean>(false);

  const teamInfo = useTeam();

  useEffect(() => {
    if (router.query.success) {
      toast.success("Upgrade success!");
      // setTimeout(() => {
      //   mutate(`/api/projects/${slug}`);
      //   // track upgrade to pro event
      //   va.track("Upgraded Plan", {
      //     plan: "pro",
      //   });
      // }, 1000);
    }
  }, [router.query.success]);

  const tiers: Tier[] = [
    {
      id: 1,
      title: "Free",
      priceMonthly: "€0/mo",
      description: "What's included:",
      currentPlan: plan && plan == "free" ? true : false,
      hasPlan: false,
      features: [
        "Unlimited links",
        "30 MB document size limit",
        "Notion documents",
        "1 user",
        "Basic support",
        "Email notifications",
        "Basic Papermark AI",
        "100 credits, 3/day",
      ],
    },
    {
      id: 2,
      title: "Pro",
      priceMonthly: "€29/mo",
      description: "Everything in Free, plus:",
      currentPlan: plan && plan == "pro" ? true : false,
      hasPlan: plan && plan !== "free" ? true : false,
      isTrial: plan && plan == "trial" ? true : false,
      features: [
        "Unlimited documents",
        "Large file uploads",
        "Team members",
        "Priority support",
        "Custom domains",
        "Custom branding",
        "Advanced Papermark AI",
        "1500 credits",
      ],
    },
    {
      id: 3,
      title: "Enterprise",
      priceMonthly: "Contact us",
      description: "Custom tailored plans, incl.:",
      currentPlan: plan && plan == "enterprise" ? true : false,
      hasPlan: plan && plan !== "free" ? true : false,
      features: [
        "Up to 5TB file uploads",
        "Dedicated support",
        "Custom Papermark AI / BYO",
        "Unlimited credits",
      ],
    },
  ];

  return (
    <AppLayout>
      <Navbar current="Billing" />

      <div className="p-4 sm:p-4 sm:m-4">
        <div className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h3 className="text-2xl text-foreground font-semibold tracking-tight">
              Billing
            </h3>
            <p className="text-sm text-muted-foreground">
              Manage your subscription and billing information.
            </p>
          </div>
        </div>

        <div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 items-stretch sm:grid-cols-3 sm:gap-4">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={cn(
                  `rounded-3xl p-8 sm:p-10 bg-white dark:bg-gray-800 flex flex-col justify-between h-full`,
                  tier.currentPlan || tier.isTrial
                    ? "ring-2 ring-primary"
                    : "ring-1 ring-gray-900/10 dark:ring-gray-200/10",
                )}
              >
                <div className="">
                  <h2 className="text-xl font-bold mb-4 inline-flex items-center gap-x-2">
                    {tier.title}{" "}
                    {tier.currentPlan ? (
                      <Badge className="rounded-none">Current Plan</Badge>
                    ) : null}
                    {tier.isTrial ? (
                      <Badge className="rounded-none">Trial</Badge>
                    ) : null}
                  </h2>
                  <div className="text-3xl font-bold mb-4">
                    {tier.priceMonthly}
                  </div>
                  <div className="text-gray-900 dark:text-gray-400 mb-6">
                    {tier.description}
                  </div>
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-center mb-2">
                      <svg
                        className="h-5 w-5 text-green-500 dark:text-green-300 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-center gap-x-6">
                  {tier.id === 1 && (
                    <div className="h-10 w-24 animate-pulse rounded-md bg-border" />
                  )}
                  {tier.id === 2 &&
                    (plan ? (
                      tier.hasPlan ? (
                        <Button
                          className={cn(
                            !tier.currentPlan &&
                              "border border-gray-700 dark:bg-secondary hover:dark:border-gray-500 hover:dark:bg-gray-700",
                          )}
                          variant={tier.currentPlan ? "default" : "default"}
                          onClick={() => {
                            setClicked(true);
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
                          }}
                          loading={clicked}
                        >
                          Manage Subscription
                        </Button>
                      ) : (
                        <UpgradePlanModal clickedPlan={"Pro"}>
                          <Button>Upgrade to Pro</Button>
                        </UpgradePlanModal>
                      )
                    ) : (
                      <div className="h-10 w-24 animate-pulse rounded-md bg-border" />
                    ))}
                  {tier.id === 3 && (
                    <Link
                      href="https://cal.com/marcseitz/papermark"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:underline"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        className="border border-gray-700 dark:bg-secondary hover:dark:border-gray-500 hover:dark:bg-gray-700"
                      >
                        Contact us
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
