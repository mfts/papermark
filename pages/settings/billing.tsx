import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";

import UpgradePlanContainer from "@/components/billing/upgrade-plan-container";
import AppLayout from "@/components/layouts/app";
import { SettingsHeader } from "@/components/settings/settings-header";

import { useAnalytics } from "@/lib/analytics";
import { usePlan } from "@/lib/swr/use-billing";

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
        "50 links",
        "50 documents",
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
      price: { monthly: "€29", annually: "€24" },
      description: "The branded experience for your documents.",
      featureIntro: "Everything in Free, plus:",
      features: [
        "1 user included",
        "Unlimited links",
        "300 documents",
        "Custom branding",
        "Folder organization",
        "Large file uploads",
        // "Require email verification",
        "More file types: ppt, docx, excel",
        "Video sharing and analytics",
        "Remove Papermark branding",
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
      price: { monthly: "€79", annually: "€59" },
      description:
        "The one for more control, data room, and multi-file sharing.",
      featureIntro: "Everything in Pro, plus:",
      features: [
        "3 users included",
        "Unlimited data rooms",
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
      price: { monthly: "€149", annually: "€99" },
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
      price: { monthly: "€299", annually: "€199" },
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

        <UpgradePlanContainer />
      </main>
    </AppLayout>
  );
}
