import Link from "next/link";
import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { CheckIcon, MinusCircleIcon, PlusCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import AppLayout from "@/components/layouts/app";
import { SettingsHeader } from "@/components/settings/settings-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import { useAnalytics } from "@/lib/analytics";
import { usePlan } from "@/lib/swr/use-billing";
import { cn } from "@/lib/utils";

const frequencies: {
  value: "monthly" | "annually";
  label: "Monthly" | "Annually";
  priceSuffix: "/month" | "/month";
}[] = [
  { value: "monthly", label: "Monthly", priceSuffix: "/month" },
  { value: "annually", label: "Annually", priceSuffix: "/month" },
];

export default function Billing() {
  const router = useRouter();
  const analytics = useAnalytics();
  const { plan, isCustomer } = usePlan();
  const [clicked, setClicked] = useState<boolean>(false);
  const frequency = frequencies[1];
  const [toggleProYear, setToggleProYear] = useState<boolean>(true);
  const [toggleBusinessYear, setToggleBusinessYear] = useState<boolean>(true);
  const [toggleDataroomsYear, setToggleDataroomsYear] = useState<boolean>(true);
  const [frequencyPro, setFrequencyPro] = useState(frequencies[0]);
  const [frequencyBusiness, setFrequencyBusiness] = useState(frequencies[0]);
  const [frequencyDatarooms, setFrequencyDatarooms] = useState(frequencies[0]);
  const [showDataRoomsPlus, setShowDataRoomsPlus] = useState(false);

  useEffect(() => {
    if (toggleProYear) {
      setFrequencyPro(frequencies[1]);
    } else {
      setFrequencyPro(frequencies[0]);
    }

    if (toggleBusinessYear) {
      setFrequencyBusiness(frequencies[1]);
    } else {
      setFrequencyBusiness(frequencies[0]);
    }
    if (toggleDataroomsYear) {
      setFrequencyDatarooms(frequencies[1]);
    } else {
      setFrequencyDatarooms(frequencies[0]);
    }
  }, [toggleProYear, toggleBusinessYear, toggleDataroomsYear]);

  const teamInfo = useTeam();

  useEffect(() => {
    if (router.query.success) {
      toast.success("Upgrade success!");
      analytics.capture("User Upgraded", {
        plan: plan,
        teamId: teamInfo?.currentTeam?.id,
        $set: { teamId: teamInfo?.currentTeam?.id, teamPlan: plan },
      });
    }

    if (router.query.cancel) {
      analytics.capture("Stripe Checkout Cancelled", {
        teamId: teamInfo?.currentTeam?.id,
      });
    }
  }, [router.query]);

  const tiers: {
    name: string;
    id: string;
    href: string;
    currentPlan: boolean;
    price: {
      monthly: string;
      annually: string;
    };
    description: string;
    featureIntro: string;
    features: string[];
    bgColor: string;
    borderColor: string;
    textColor: string;
    buttonText: string;
    mostPopular: boolean;
  }[] = [
    {
      name: "Free",
      id: "tier-free",
      href: "/login",
      currentPlan: plan && plan == "free" ? true : false,
      price: { monthly: "€0", annually: "€0" },
      description: "The essentials to start sharing documents securely.",
      featureIntro: "What's included:",
      features: [
        "1 user",
        "10 documents",
        "10 links",
        "Unlimited visitors",
        "Page-by-page analytics",
        "Document sharing controls",
        "Password protection",
        "30-day analytics retention",
      ],
      bgColor: "bg-gray-200",
      borderColor: "#bg-gray-800",
      textColor: "text-foreground ",
      buttonText: "Start for free",
      mostPopular: false,
    },
    {
      name: "Pro",
      id: "tier-pro",
      href: "/login",
      currentPlan: plan && plan == "pro" ? true : false,
      price: { monthly: "€39", annually: "€25" },
      description: "The branded experience for your documents.",
      featureIntro: "Everything in Free, plus:",
      features: [
        "2 users included",
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
      bgColor: "bg-gray-200",
      borderColor: "#bg-gray-800",
      textColor: "#bg-gray-500",
      buttonText: "Upgrade to Pro",
      mostPopular: false,
    },
    {
      name: "Business",
      id: "tier-business",
      href: "/login",
      currentPlan: plan && plan == "business" ? true : false,
      price: { monthly: "€79", annually: "€45" },
      description:
        "The one for more control, data room, and multi-file sharing.",
      featureIntro: "Everything in Pro, plus:",
      features: [
        "3 users included",
        "1 dataroom",
        "1000 documents",
        "Custom domain for documents",
        "Unlimited folder levels",
        "Multi-file sharing",
        "Screen shield/fence protection",
        "Allow/Block list",
        "Dataroom branding",
        "Webhooks",
        "More file types: dwg, kml, zip",
        "2-year analytics retention",
      ],
      bgColor: "#bg-gray-500",
      borderColor: "#fb7a00",
      textColor: "#bg-gray-500",
      buttonText: "Upgrade to Business",
      mostPopular: true,
    },
    {
      name: "Data Rooms",
      id: "tier-datarooms",
      href: "/login",
      currentPlan: plan && plan == "datarooms" ? true : false,
      price: { monthly: "€199", annually: "€99" },
      description:
        "The one for more control, data room, and multi-file sharing.",
      featureIntro: "Everything in Business, plus:",
      features: [
        "3 users included",
        "Unlimited data rooms",
        "Unlimited documents",
        "One custom domain for data rooms",
        "Data rooms analytics",
        "NDA agreements",
        "Dynamic watermark",
        "Granular user/group permissions",
        "Audit log for viewers",
        "24h priority support",
        "Custom onboarding",
        "2-year analytics retention",
      ],
      bgColor: "#fb7a00",
      borderColor: "#fb7a00",
      textColor: "#black",
      buttonText: "Upgrade to Data Rooms",
      mostPopular: true,
    },
    {
      name: "Data Rooms Plus",
      id: "tier-datarooms-plus",
      href: "/login",
      currentPlan: plan && plan == "datarooms-plus" ? true : false,
      price: { monthly: "€399", annually: "€249" },
      description:
        "The ultimate data room solution with advanced features and unlimited storage.",
      featureIntro: "Everything in Data Rooms, plus:",
      features: [
        "5 users included",
        "Unlimited storage",
        "No file size limit",
        "Unlimited custom domains for data rooms",
        "Q&A module with permissions",
        "Automatic file indexing",
        "Assign users to data room",
        "Email invite viewers directly from Papermark",
        "White-labeling",
        "Dedicated account manager",
        "3-year analytics retention",
      ],
      bgColor: "bg-gray-900",
      borderColor: "border-gray-900",
      textColor: "text-white",
      buttonText: "Upgrade to Data Rooms Plus",
      mostPopular: true,
    },
  ];

  const enterpriseFeatures = [
    "Self-hosted version",
    "Bring your own storage for documents",
    "Unlimited users",
    "Unlimited documents",
    "Unlimited folders and subfolders",
    "Unlimited datarooms",
    "Unlimited storage",
    "Full white-labeling",
    "No file size limit",
    "Single sign-on (SSO)",
    "Dedicated support",
    "Custom onboarding",
  ];

  const displayTiers = tiers.filter(
    (tier) =>
      tier.name !== (showDataRoomsPlus ? "Data Rooms" : "Data Rooms Plus"),
  );

  const dataRoomsIndex = displayTiers.findIndex(
    (tier) => tier.name === "Data Rooms" || tier.name === "Data Rooms Plus",
  );

  if (dataRoomsIndex !== -1) {
    const currentTier = displayTiers[dataRoomsIndex];
    displayTiers[dataRoomsIndex] = {
      ...currentTier,
      name: showDataRoomsPlus ? "Data Rooms Plus" : "Data Rooms",
      price: showDataRoomsPlus
        ? { monthly: "€299", annually: "€249" }
        : { monthly: "€199", annually: "€99" },
      features: showDataRoomsPlus
        ? [
            "5 users included",
            "Unlimited encrypted storage",
            "No file size limit",
            "Unlimited custom domains for data rooms",
            "Q&A module with custom permissions",
            "Automatic file indexing",
            "Assign users to particular data room",
            "Email invite viewers directly from Papermark",
            "White-labeling",
            "Dedicated account manager",
            "3-year analytics retention",
          ]
        : [
            "3 users included",
            "Unlimited data rooms",
            "Unlimited documents",
            "One custom domain for data rooms",
            "Data rooms analytics",
            "NDA agreements",
            "Dynamic watermark",
            "Granular user/group permissions",
            "Audit log for viewers",
            "24h priority support",
            "Custom onboarding",
            "2-year analytics retention",
          ],
    };
  }

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <SettingsHeader />

        <div>
          <div className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
            <div className="space-y-1">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                Billing
              </h3>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  Manage your subscription and billing information.
                </p>
                <Link
                  href="/settings/upgrade"
                  className="text-sm text-foreground underline-offset-4 hover:underline"
                >
                  See all plans
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900">
            <div className="mx-auto space-y-8">
              <div className="isolate grid grid-cols-1 overflow-hidden rounded-xl border border-black dark:border-muted-foreground md:grid-cols-4">
                {displayTiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="flex flex-col justify-between border-r-0 border-black dark:border-muted-foreground md:border-r md:last:!border-r-0"
                  >
                    <div>
                      <div className="border-b border-black bg-gray-100 p-6 dark:border-muted-foreground dark:bg-gray-500">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-x-3">
                            <h3
                              id={tier.id}
                              className="flex items-center text-balance text-xl leading-8 text-foreground"
                            >
                              {tier.name}
                            </h3>
                            {tier.currentPlan ? (
                              <Badge className="rounded-md">Current Plan</Badge>
                            ) : null}
                          </div>
                          {(tier.name === "Data Rooms" ||
                            tier.name === "Data Rooms Plus") && (
                            <div className="flex items-center gap-x-2">
                              <button
                                onClick={() =>
                                  setShowDataRoomsPlus(!showDataRoomsPlus)
                                }
                                className="focus:outline-none"
                              >
                                {showDataRoomsPlus ? (
                                  <MinusCircleIcon className="h-6 w-6 text-[#fb7a00] hover:text-[#fb7a00]/90" />
                                ) : (
                                  <PlusCircleIcon className="h-6 w-6 text-[#fb7a00] hover:text-[#fb7a00]/90" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="mt-2">
                          {tier.id === "tier-enterprise" ? (
                            <div className="min-h-12">
                              <div className="flex flex-col text-sm">
                                <div className="h-6"></div>
                                <h4>Get in touch</h4>
                              </div>
                            </div>
                          ) : null}
                        </div>

                        {/* <p className="mt-4 text-balance text-sm leading-6 text-gray-600 dark:text-muted-foreground">
                          {tier.description}
                        </p> */}
                        <ul
                          role="list"
                          className="mt-8 space-y-3 text-sm leading-6 text-gray-600 dark:text-muted-foreground"
                        >
                          <li>{tier.featureIntro}</li>
                          {tier.features.map((feature) => (
                            <li key={feature} className="flex gap-x-3">
                              <CheckIcon
                                className="h-6 w-5 flex-none text-[#fb7a00]"
                                aria-hidden="true"
                              />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="p-6">
                      {tier.id !==
                      "tier-free" /** hide button on free tier */ ? (
                        tier.currentPlan && isCustomer ? (
                          <Button
                            className="rounded-3xl"
                            loading={clicked}
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
                          >
                            {clicked
                              ? "Redirecting to Customer Portal..."
                              : "Manage Subscription"}
                          </Button>
                        ) : plan !== "free" && isCustomer ? (
                          <Button
                            className="rounded-3xl"
                            variant={
                              tier.id === "tier-business" ? "orange" : "default"
                            }
                            loading={clicked}
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
                          >
                            {clicked
                              ? "Redirecting to Customer Portal..."
                              : tier.buttonText}
                          </Button>
                        ) : (
                          <UpgradePlanModal
                            clickedPlan={
                              tier.name as "Pro" | "Business" | "Data Rooms"
                            }
                            trigger={"billing_page"}
                          >
                            <Button
                              className="rounded-3xl"
                              variant={
                                tier.id === "tier-business"
                                  ? "orange"
                                  : "default"
                              }
                            >
                              {tier.buttonText}
                            </Button>
                          </UpgradePlanModal>
                        )
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              <div className="isolate grid grid-cols-1 overflow-hidden rounded-xl border border-black dark:border-muted-foreground">
                <div
                  key="tier-enterprise"
                  className="flex flex-col justify-between border-r-0 border-black dark:border-muted-foreground md:border-r md:last:!border-r-0"
                >
                  <div>
                    <div className="border-b border-black bg-gray-100 p-6 dark:border-muted-foreground dark:bg-gray-800">
                      <h3
                        id="tier-enterprise"
                        className="flex items-center gap-x-2 text-balance text-xl leading-8 text-foreground"
                      >
                        <span>Enterprise</span>
                      </h3>
                    </div>
                    <div className="p-6">
                      <p className="mt-4 text-balance text-sm leading-6 text-gray-600 dark:text-muted-foreground">
                        Self-hosted and advanced document infrastructure for
                        your company.
                      </p>
                      <p className="mt-6 flex items-baseline gap-x-1">
                        <span className="text-balance text-4xl font-medium text-foreground">
                          Custom
                        </span>
                      </p>
                      <ul
                        role="list"
                        className="mt-8 grid grid-cols-1 gap-y-3 text-sm leading-6 text-gray-600 dark:text-muted-foreground sm:grid-cols-2 md:grid-cols-3"
                      >
                        {enterpriseFeatures.map((feature) => (
                          <li key={feature} className="flex gap-x-3">
                            <CheckIcon
                              className="h-6 w-5 flex-none text-[#fb7a00]"
                              aria-hidden="true"
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="p-6">
                    <Link
                      href="https://cal.com/marcseitz/papermark"
                      target="_blank"
                    >
                      <Button className="rounded-3xl">Talk to us</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
