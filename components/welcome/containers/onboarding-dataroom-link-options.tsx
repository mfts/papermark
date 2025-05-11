import { useState } from "react";

import { LinkPreset, LinkType } from "@prisma/client";

import { DEFAULT_LINK_TYPE } from "@/components/links/link-sheet";
import AgreementSection from "@/components/links/link-sheet/agreement-section";
import AllowDownloadSection from "@/components/links/link-sheet/allow-download-section";
import AllowListSection from "@/components/links/link-sheet/allow-list-section";
import AllowNotificationSection from "@/components/links/link-sheet/allow-notification-section";
import CustomFieldsSection from "@/components/links/link-sheet/custom-fields-section";
import DenyListSection from "@/components/links/link-sheet/deny-list-section";
import EmailAuthenticationSection from "@/components/links/link-sheet/email-authentication-section";
import EmailProtectionSection from "@/components/links/link-sheet/email-protection-section";
import ExpirationSection from "@/components/links/link-sheet/expiration-section";
import FeedbackSection from "@/components/links/link-sheet/feedback-section";
import OGSection from "@/components/links/link-sheet/og-section";
import PasswordSection from "@/components/links/link-sheet/password-section";
import { ProBannerSection } from "@/components/links/link-sheet/pro-banner-section";
import QuestionSection from "@/components/links/link-sheet/question-section";
import ScreenshotProtectionSection from "@/components/links/link-sheet/screenshot-protection-section";
import WatermarkSection from "@/components/links/link-sheet/watermark-section";
import ChevronDown from "@/components/shared/icons/chevron-down";

export const OnboardingDataroomLinkOptions = ({
  data,
  setData,
  targetId,
  currentPreset = null,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
  targetId?: string;
  currentPreset?: LinkPreset | null;
}) => {
  const [showOtherSettings, setShowOtherSettings] = useState(false);

  // Always shown (free)
  const alwaysShown = (
    <>
      <EmailProtectionSection {...{ data, setData }} />
      <EmailAuthenticationSection
        {...{ data, setData }}
        isAllowed={true}
        handleUpgradeStateChange={() => {}}
      />
      <AllowNotificationSection {...{ data, setData }} />
      <AllowDownloadSection {...{ data, setData }} />
      <PasswordSection {...{ data, setData }} />
      <AllowListSection
        data={data}
        setData={setData}
        isAllowed={true}
        handleUpgradeStateChange={() => {}}
        presets={currentPreset}
      />
      <DenyListSection
        data={data}
        setData={setData}
        isAllowed={true}
        handleUpgradeStateChange={() => {}}
        presets={currentPreset}
      />
      <ScreenshotProtectionSection
        data={data}
        setData={setData}
        isAllowed={true}
        handleUpgradeStateChange={() => {}}
      />
      <WatermarkSection
        data={data}
        setData={setData}
        isAllowed={true}
        handleUpgradeStateChange={() => {}}
        presets={currentPreset}
      />
      <AgreementSection
        data={data}
        setData={setData}
        isAllowed={true}
        handleUpgradeStateChange={() => {}}
      />
      <CustomFieldsSection
        data={data}
        setData={setData}
        isAllowed={true}
        handleUpgradeStateChange={() => {}}
        presets={currentPreset}
      />
      <div className="mb-4 mt-2">
        <button
          type="button"
          className="group flex w-full items-center justify-between text-sm text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setShowOtherSettings((v) => !v)}
          aria-expanded={showOtherSettings}
        >
          <span className="text-sm font-semibold text-gray-900">
            Other custom settings
          </span>
          <span
            className={`transition-transform ${showOtherSettings ? "rotate-180" : ""}`}
          >
            <ChevronDown className="h-4 w-4" />
          </span>
        </button>
      </div>
    </>
  );

  // Under toggle
  const otherSettings = (
    <>
      <ExpirationSection {...{ data, setData }} presets={currentPreset} />
      <OGSection
        data={data}
        setData={setData}
        isAllowed={true}
        handleUpgradeStateChange={() => {}}
        editLink={false}
        presets={currentPreset}
      />

      <FeedbackSection data={data} setData={setData} />
      <QuestionSection
        data={data}
        setData={setData}
        isAllowed={true}
        handleUpgradeStateChange={() => {}}
      />

      <ProBannerSection
        data={data}
        setData={setData}
        isAllowed={true}
        handleUpgradeStateChange={() => {}}
      />
    </>
  );

  return (
    <div>
      {alwaysShown}
      {showOtherSettings && otherSettings}
    </div>
  );
};
