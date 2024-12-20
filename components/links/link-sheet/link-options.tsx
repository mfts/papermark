import { useState } from "react";

import { LinkAudienceType, LinkType } from "@prisma/client";

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
import ScreenShieldSection from "./screen-shield-section";
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
  editLink,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
  linkType: LinkType;
  editLink?: boolean;
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
  const allowWatermarkOnBusiness = limits?.watermarkOnBusiness ?? false;

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
        editLink={editLink ?? false}
      />

      <EmailAuthenticationSection
        {...{ data, setData }}
        isAllowed={isTrial || isPro || isBusiness || isDatarooms}
        handleUpgradeStateChange={handleUpgradeStateChange}
      />
      {data.audienceType === LinkAudienceType.GENERAL ? (
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
      ) : null}
      {data.audienceType === LinkAudienceType.GENERAL ? (
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
      ) : null}
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
      <ScreenShieldSection
        {...{ data, setData }}
        isAllowed={isTrial || isBusiness || isDatarooms}
        handleUpgradeStateChange={handleUpgradeStateChange}
      />
      <WatermarkSection
        {...{ data, setData }}
        isAllowed={isTrial || isDatarooms || allowWatermarkOnBusiness}
        handleUpgradeStateChange={handleUpgradeStateChange}
      />
      <AgreementSection
        {...{ data, setData }}
        isAllowed={isTrial || isDatarooms}
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
