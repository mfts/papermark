import { useState } from "react";

import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import { DEFAULT_LINK_TYPE } from "@/components/links/link-sheet";
import AllowDownloadSection from "@/components/links/link-sheet/allow-download-section";
import AllowListSection from "@/components/links/link-sheet/allow-list-section";
import AllowNotificationSection from "@/components/links/link-sheet/allow-notification-section";
import DenyListSection from "@/components/links/link-sheet/deny-list-section";
import EmailAuthenticationSection from "@/components/links/link-sheet/email-authentication-section";
import EmailProtectionSection from "@/components/links/link-sheet/email-protection-section";
import ExpirationSection from "@/components/links/link-sheet/expiration-section";
import FeedbackSection from "@/components/links/link-sheet/feedback-section";
import OGSection from "@/components/links/link-sheet/og-section";
import PasswordSection from "@/components/links/link-sheet/password-section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { usePlan } from "@/lib/swr/use-billing";
import useLimits from "@/lib/swr/use-limits";

import AgreementSection from "./agreement-section";
import QuestionSection from "./question-section";
import ScreenshotProtectionSection from "./screenshot-protection-section";

export type LinkUpgradeOptions = {
  state: boolean;
  trigger: string;
  plan?: "Pro" | "Business" | "Data Rooms";
};

export const LinkOptions = ({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
}) => {
  const { plan } = usePlan();
  const { limits } = useLimits();
  const hasFreePlan = plan === "free";
  const isNotBusiness = plan !== "business";
  const isNotDatarooms = plan !== "datarooms";

  const [openUpgradeModal, setOpenUpgradeModal] = useState<boolean>(false);
  const [trigger, setTrigger] = useState<string>("");
  const [upgradePlan, setUpgradePlan] = useState<
    "Pro" | "Business" | "Data Rooms"
  >("Business");

  const handleUpgradeStateChange = ({
    state,
    trigger,
    plan,
  }: LinkUpgradeOptions) => {
    setOpenUpgradeModal(state);
    setTrigger(trigger);
    if (plan) {
      setUpgradePlan(plan);
    }
  };

  return (
    <div>
      <EmailProtectionSection {...{ data, setData }} />
      <AllowNotificationSection {...{ data, setData }} />
      <AllowDownloadSection {...{ data, setData }} />
      <ExpirationSection {...{ data, setData }} />
      <OGSection
        {...{ data, setData }}
        hasFreePlan={
          isNotBusiness && isNotDatarooms && !limits?.advancedLinkControlsOnPro
        }
        handleUpgradeStateChange={handleUpgradeStateChange}
      />

      <EmailAuthenticationSection
        {...{ data, setData }}
        hasFreePlan={hasFreePlan}
        handleUpgradeStateChange={handleUpgradeStateChange}
      />
      <AllowListSection
        {...{ data, setData }}
        hasFreePlan={
          isNotBusiness && isNotDatarooms && !limits?.advancedLinkControlsOnPro
        }
        handleUpgradeStateChange={handleUpgradeStateChange}
      />
      <DenyListSection
        {...{ data, setData }}
        hasFreePlan={
          isNotBusiness && isNotDatarooms && !limits?.advancedLinkControlsOnPro
        }
        handleUpgradeStateChange={handleUpgradeStateChange}
      />
      <PasswordSection {...{ data, setData }} />
      <ScreenshotProtectionSection
        {...{ data, setData }}
        hasFreePlan={
          isNotBusiness && isNotDatarooms && !limits?.advancedLinkControlsOnPro
        }
        handleUpgradeStateChange={handleUpgradeStateChange}
      />
      <FeedbackSection {...{ data, setData }} />
      <QuestionSection
        {...{ data, setData }}
        hasFreePlan={
          isNotBusiness && isNotDatarooms && !limits?.advancedLinkControlsOnPro
        }
        handleUpgradeStateChange={handleUpgradeStateChange}
      />
      <AgreementSection
        {...{ data, setData }}
        hasFreePlan={isNotDatarooms}
        handleUpgradeStateChange={handleUpgradeStateChange}
      />

      <UpgradePlanModal
        clickedPlan={upgradePlan}
        open={openUpgradeModal}
        setOpen={setOpenUpgradeModal}
        trigger={trigger}
      />
    </div>
  );
};
