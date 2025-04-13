import { useState } from "react";

import { PlanEnum } from "@/ee/stripe/constants";
import { LinkAudienceType, LinkType } from "@prisma/client";

import { usePlan } from "@/lib/swr/use-billing";
import useLimits from "@/lib/swr/use-limits";

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

import AgreementSection from "./agreement-section";
import ConversationSection from "./conversation-section";
import CustomFieldsSection from "./custom-fields-section";
import QuestionSection from "./question-section";
import ScreenshotProtectionSection from "./screenshot-protection-section";
import UploadSection from "./upload-section";
import WatermarkSection from "./watermark-section";

export type LinkUpgradeOptions = {
  state: boolean;
  trigger: string;
  plan?: "Pro" | "Business" | "Data Rooms" | "Data Rooms Plus";
};

export const LinkOptions = ({
  data,
  setData,
  targetId,
  linkType,
  editLink,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
  targetId?: string;
  linkType: LinkType;
  editLink?: boolean;
}) => {
  const {
    isStarter,
    isPro,
    isBusiness,
    isDatarooms,
    isDataroomsPlus,
    isTrial,
  } = usePlan();
  const { limits } = useLimits();

  const allowAdvancedLinkControls = limits
    ? limits?.advancedLinkControlsOnPro
    : false;
  const allowWatermarkOnBusiness = limits?.watermarkOnBusiness ?? false;

  const [openUpgradeModal, setOpenUpgradeModal] = useState<boolean>(false);
  const [trigger, setTrigger] = useState<string>("");
  const [upgradePlan, setUpgradePlan] = useState<PlanEnum>(PlanEnum.Business);

  const handleUpgradeStateChange = ({
    state,
    trigger,
    plan,
  }: LinkUpgradeOptions) => {
    setOpenUpgradeModal(state);
    setTrigger(trigger);
    if (plan) {
      setUpgradePlan(plan as PlanEnum);
    }
  };

  return (
    <div>
      <EmailProtectionSection {...{ data, setData }} />
      <AllowNotificationSection {...{ data, setData }} />
      <AllowDownloadSection {...{ data, setData }} />
      <ExpirationSection {...{ data, setData }} />
      {limits?.dataroomUpload &&
      linkType === LinkType.DATAROOM_LINK &&
      targetId ? (
        <UploadSection
          {...{ data, setData }}
          isAllowed={isTrial || isDatarooms || isDataroomsPlus}
          handleUpgradeStateChange={handleUpgradeStateChange}
          targetId={targetId}
        />
      ) : null}
      <OGSection
        {...{ data, setData }}
        isAllowed={
          isTrial ||
          (isPro && allowAdvancedLinkControls) ||
          isBusiness ||
          isDatarooms ||
          isDataroomsPlus
        }
        handleUpgradeStateChange={handleUpgradeStateChange}
        editLink={editLink ?? false}
      />

      <EmailAuthenticationSection
        {...{ data, setData }}
        isAllowed={
          isTrial ||
          (isPro && allowAdvancedLinkControls) ||
          isBusiness ||
          isDatarooms ||
          isDataroomsPlus
        }
        handleUpgradeStateChange={handleUpgradeStateChange}
      />
      {data.audienceType === LinkAudienceType.GENERAL ? (
        <AllowListSection
          {...{ data, setData }}
          isAllowed={
            isTrial ||
            (isPro && allowAdvancedLinkControls) ||
            isBusiness ||
            isDatarooms ||
            isDataroomsPlus
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
            isDatarooms ||
            isDataroomsPlus
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
          isDatarooms ||
          isDataroomsPlus
        }
        handleUpgradeStateChange={handleUpgradeStateChange}
      />
      <WatermarkSection
        {...{ data, setData }}
        isAllowed={
          isTrial || isDatarooms || isDataroomsPlus || allowWatermarkOnBusiness
        }
        handleUpgradeStateChange={handleUpgradeStateChange}
      />
      <AgreementSection
        {...{ data, setData }}
        isAllowed={
          isTrial || isDatarooms || isDataroomsPlus || allowWatermarkOnBusiness
        }
        handleUpgradeStateChange={handleUpgradeStateChange}
      />
      {linkType === LinkType.DATAROOM_LINK &&
      limits?.conversationsInDataroom ? (
        <ConversationSection
          {...{ data, setData }}
          isAllowed={
            isDataroomsPlus ||
            ((isBusiness || isDatarooms) && limits?.conversationsInDataroom)
          }
          handleUpgradeStateChange={handleUpgradeStateChange}
        />
      ) : null}
      {linkType === LinkType.DOCUMENT_LINK ? (
        <>
          <FeedbackSection {...{ data, setData }} />
          <QuestionSection
            {...{ data, setData }}
            isAllowed={
              isTrial ||
              (isPro && allowAdvancedLinkControls) ||
              isBusiness ||
              isDatarooms ||
              isDataroomsPlus
            }
            handleUpgradeStateChange={handleUpgradeStateChange}
          />
        </>
      ) : null}
      <CustomFieldsSection
        {...{ data, setData }}
        isAllowed={isTrial || isBusiness || isDatarooms || isDataroomsPlus}
        handleUpgradeStateChange={handleUpgradeStateChange}
      />
      {linkType === LinkType.DOCUMENT_LINK ? (
        <ProBannerSection
          {...{ data, setData }}
          isAllowed={
            isTrial ||
            isPro ||
            isBusiness ||
            isDatarooms ||
            isDataroomsPlus ||
            isStarter
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
