import { useState } from "react";

import { LinkType } from "@prisma/client";

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
import { ProBannerSection } from "@/components/links/link-sheet/pro-banner-section";

import { usePlan } from "@/lib/swr/use-billing";
import useLimits from "@/lib/swr/use-limits";

import AgreementSection from "./agreement-section";
import QuestionSection from "./question-section";
import ScreenshotProtectionSection from "./screenshot-protection-section";
import WatermarkSection from "./watermark-section";

export type LinkUpgradeOptions = {
  state: boolean;
  trigger: string;
  plan?: "Pro" | "Business" | "Data Rooms";
};

export const LinkOptions = ({
  data,
  setData,
  linkType,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
  linkType: LinkType;
}) => {
  const { plan, trial } = usePlan();
  const { limits } = useLimits();

  const isTrial = !!trial;
  const isPro = plan === "pro";
  const isBusiness = plan === "business";
  const isDatarooms = plan === "datarooms";
  const allowAdvancedLinkControls = limits
    ? limits?.advancedLinkControlsOnPro
    : false;

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
        isAllowed={
          isTrial ||
          (isPro && allowAdvancedLinkControls) ||
          isBusiness ||
          isDatarooms
        }
        handleUpgradeStateChange={handleUpgradeStateChange}
      />

      <EmailAuthenticationSection
        {...{ data, setData }}
        isAllowed={isTrial || isPro || isBusiness || isDatarooms}
        handleUpgradeStateChange={handleUpgradeStateChange}
      />
      <AllowListSection
        {...{ data, setData }}
        isAllowed={
          isTrial ||
          (isPro && allowAdvancedLinkControls) ||
          isBusiness ||
          isDatarooms
        }
        handleUpgradeStateChange={handleUpgradeStateChange}
      />
      <DenyListSection
        {...{ data, setData }}
        isAllowed={
          isTrial ||
          (isPro && allowAdvancedLinkControls) ||
          isBusiness ||
          isDatarooms
        }
        handleUpgradeStateChange={handleUpgradeStateChange}
      />
      <PasswordSection {...{ data, setData }} />
      <ScreenshotProtectionSection
        {...{ data, setData }}
        isAllowed={
          isTrial ||
          (isPro && allowAdvancedLinkControls) ||
          isBusiness ||
          isDatarooms
        }
        handleUpgradeStateChange={handleUpgradeStateChange}
      />
      <FeedbackSection {...{ data, setData }} />
      <QuestionSection
        {...{ data, setData }}
        isAllowed={
          isTrial ||
          (isPro && allowAdvancedLinkControls) ||
          isBusiness ||
          isDatarooms
        }
        handleUpgradeStateChange={handleUpgradeStateChange}
      />
      <WatermarkSection
        {...{ data, setData }}
        isAllowed={isTrial || isDatarooms}
        handleUpgradeStateChange={handleUpgradeStateChange}
      />
      <AgreementSection
        {...{ data, setData }}
        isAllowed={isTrial || isDatarooms}
        handleUpgradeStateChange={handleUpgradeStateChange}
      />
      {linkType === LinkType.DOCUMENT_LINK ? (
        <ProBannerSection
          {...{ data, setData }}
          isAllowed={
            isTrial || isPro || isBusiness || isDatarooms || plan === "starter"
          }
          handleUpgradeStateChange={handleUpgradeStateChange}
        />
      ) : null}
      <UpgradePlanModal
        clickedPlan={upgradePlan}
        open={openUpgradeModal}
        setOpen={setOpenUpgradeModal}
        trigger={trigger}
      />
    </div>
  );
};
