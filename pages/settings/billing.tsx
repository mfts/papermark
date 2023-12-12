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
      description: "Enjoy free access",
      currentPlan: plan && plan == "free" ? true : false,
      hasPlan: false,
      features: [
        "PDF up to 30 mb",
        "Unlimited links",
        "Analytics for each page",
        "Feedback on each page",
        "Notion Documents",
        "Email Notifications on views",
        "Papermark AI",
        "100 questions, 3/day",
      ],
    },
    {
      id: 2,
      title: "Starter",
      priceMonthly: "€15/mo",
      description: "All free features +",
      currentPlan: plan && plan == "starter" ? true : false,
      hasPlan: plan && plan !== "free" ? true : false,
      features: [
        "Custom domains",
        "Unlimited documents",
        "Papermark AI",
        "500 questions",
      ],
    },
    {
      id: 3,
      title: "Pro",
      priceMonthly: "€30/mo",
      description: "All features and more",
      currentPlan: plan && plan == "pro" ? true : false,
      hasPlan: plan && plan !== "free" ? true : false,
      isTrial: plan && plan == "trial" ? true : false,
      features: [
        "Team members",
        "Priority Support",
        "Custom Branding",
        "Large file uploads",
        "Papermark AI",
        "1500 questions",
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
              Manage your subscription{" "}
              <Link
                href="https://cal.com/marcseitz/papermark"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:underline"
              >
                contact us
              </Link>{" "}
              for support and enterprise requests
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
                  {tier.id === 1 &&
                    (plan ? (
                      tier.currentPlan ? (
                        <UpgradePlanModal clickedPlan={"Pro"}>
                          <Button type="button">Upgrade to Pro</Button>
                        </UpgradePlanModal>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          className="border border-gray-700"
                          disabled
                        >
                          Change plan
                        </Button>
                      )
                    ) : (
                      <div className="h-10 w-24 animate-pulse rounded-md bg-border" />
                    ))}
                  {tier.id === 2 &&
                    (plan ? (
                      tier.hasPlan ? (
                        <Button
                          className={cn(
                            !tier.currentPlan &&
                              "border border-gray-700 dark:bg-secondary hover:dark:border-gray-500 hover:dark:bg-gray-700",
                          )}
                          variant={tier.currentPlan ? "default" : "outline"}
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
                        <UpgradePlanModal clickedPlan={"Starter"}>
                          <Button
                            type="button"
                            variant="outline"
                            className="border border-gray-700 dark:bg-secondary hover:dark:border-gray-500 hover:dark:bg-gray-700"
                          >
                            Upgrade to Starter
                          </Button>
                        </UpgradePlanModal>
                      )
                    ) : (
                      <div className="h-10 w-24 animate-pulse rounded-md bg-border" />
                    ))}
                  {tier.id === 3 &&
                    (plan ? (
                      tier.hasPlan ? (
                        <Button
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
                          {tier.currentPlan
                            ? `Manage Subscription`
                            : `Upgrade to Pro`}
                        </Button>
                      ) : (
                        <UpgradePlanModal clickedPlan={"Pro"}>
                          <Button type="button">
                            {tier.isTrial
                              ? "Upgrade to remain on Pro"
                              : "Upgrade to Pro"}
                          </Button>
                        </UpgradePlanModal>
                      )
                    ) : (
                      <div className="h-10 w-24 animate-pulse rounded-md bg-border" />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* <div>
          <div className="rounded-lg border border-border bg-secondary">
            <div className="flex flex-col space-y-3 p-10">
              <h2 className="text-xl font-medium">Plan &amp; Usage</h2>
              <p className="text-sm text-secondary-foreground">
                You are currently on the{" "}
                {plan ? (
                  <Badge>{plan}</Badge>
                ) : (
                  <span className="rounded-full bg-border px-2 py-0.5 text-xs text-foreground">
                    load
                  </span>
                )}{" "}
                plan.
                {endsAt && startsAt && (
                  <>
                    {" "}
                    Current billing cycle:{" "}
                    <span className="font-medium text-foreground">
                      {`${formattedDate(startsAt)} - ${formattedDate(endsAt)}`}
                    </span>
                    .
                  </>
                )}
              </p>
            </div>
            <div className="border-b border-gray-200 dark:border-gray-700" />
            <div className="grid grid-cols-1 divide-y divide-gray-200 dark:divide-gray-700 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="p-10">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">Total Documents</h3>
                </div>
                {plan === "enterprise" ? (
                  <div className="mt-4 flex items-center">
                    {usage || usage === 0 ? (
                      <Number value={usage}>
                        <p className="text-2xl font-semibold text-black">
                          {nFormatter(usage)}
                        </p>
                      </Number>
                    ) : (
                      <div className="h-8 w-8 animate-pulse rounded-md bg-gray-200" />
                    )}
                    <Divider className="h-8 w-8 text-gray-500" />
                    <Infinity className="h-8 w-8 text-gray-500" />
                  </div>
                ) : (
                  <div className="mt-2 flex flex-col space-y-2">
                    {usage !== undefined && usageLimit ? (
                      <p className="text-sm text-gray-600">
                        <Number value={usage}>
                          <span>{nFormatter(usage)} </span>
                        </Number>
                        / {nFormatter(usageLimit)} clicks (
                        {((usage / usageLimit) * 100).toFixed(1)}%)
                      </p>
                    ) : (
                      <div className="h-5 w-32 animate-pulse rounded-md bg-gray-200" />
                    )}
                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width:
                            usage !== undefined && usageLimit
                              ? (usage / usageLimit) * 100 + "%"
                              : "0%",
                        }}
                        transition={{ duration: 0.5, type: "spring" }}
                        className={`${
                          usage && usageLimit && usage > usageLimit
                            ? "bg-red-500"
                            : "bg-blue-500"
                        } h-3 rounded-full`}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-10">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">Number of Links</h3>
                  <InfoTooltip content="Number of short links in your project." />
                </div>
                <div className="mt-4 flex items-center">
                  {links || links === 0 ? (
                    <Number value={links} unit="links">
                      <p className="text-2xl font-semibold text-black">
                        {nFormatter(links)}
                      </p>
                    </Number>
                  ) : (
                    <div className="h-8 w-8 animate-pulse rounded-md bg-gray-200" />
                  )}
                  <Divider className="h-8 w-8 text-gray-500" />
                  <Infinity className="h-8 w-8 text-gray-500" />
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700" />
            <div className="flex flex-col items-center justify-between space-y-3 px-10 py-4 text-center sm:flex-row sm:space-y-0 sm:text-left">
              {plan ? (
                <p className="text-sm text-muted-foreground">
                  {plan === "pro"
                    ? "On the Pro plan, the sky's the limit! Thank you for your support."
                    : "For higher limits, upgrade to the Pro plan."}
                </p>
              ) : (
                <div className="h-3 w-28 animate-pulse rounded-full bg-border" />
              )}
              <div>
                {plan ? (
                  plan !== "pro" ? (
                    <UpgradePlanModal>
                      <Button type="button">Upgrade</Button>
                    </UpgradePlanModal>
                  ) : (
                    <Button
                      onClick={() => {
                        setClicked(true);
                        fetch(
                          `/api/teams/${teamInfo?.currentTeam?.id}/billing/manage`,
                          {
                            method: "POST",
                          }
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
                      loading={clicked}>
                      Manage Subscription
                    </Button>
                  )
                ) : (
                  <div className="h-10 w-24 animate-pulse rounded-md bg-border" />
                )}
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </AppLayout>
  );
}
