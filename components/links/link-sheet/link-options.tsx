import { Dispatch, SetStateAction, useState } from "react";
import { DEFAULT_LINK_TYPE } from "@/components/links/link-sheet";

import EmailProtectionSection from "@/components/links/link-sheet/email-protection-section";
import AllowNotificationSection from "@/components/links/link-sheet/allow-notification-section";
import AllowDownloadSection from "@/components/links/link-sheet/allow-download-section";
import ExpirationSection from "@/components/links/link-sheet/expiration-section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import EmailAuthenticationSection from "@/components/links/link-sheet/email-authentication-section";
import AllowListSection from "@/components/links/link-sheet/allow-list-section";
import DenyListSection from "@/components/links/link-sheet/deny-list-section";
import PasswordSection from "@/components/links/link-sheet/password-section";
import OGSection from "@/components/links/link-sheet/og-section";
import FeedbackSection from "@/components/links/link-sheet/feedback-section";
import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import { usePlan } from "@/lib/swr/use-billing";
import QuestionSection from "./question-section";
import ScreenshotProtectionSection from "./screenshot-protection-section";

export const LinkOptions = ({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
}) => {
  const { plan } = usePlan();
  const hasFreePlan = plan?.plan === "free";
  const isNotBusiness = plan?.plan !== "business";

  const [openUpgradeModal, setOpenUpgradeModal] = useState<boolean>(false);
  const [trigger, setTrigger] = useState<string>("");
  const [upgradePlan, setUpgradePlan] = useState<"Pro" | "Business">("Pro");

  const handleUpgradeStateChange = (
    state: boolean,
    trigger: string,
    plan?: "Pro" | "Business",
  ) => {
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
        hasFreePlan={hasFreePlan}
        handleUpgradeStateChange={handleUpgradeStateChange}
      />

      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="py-0 rounded-lg space-x-2">
            <span className="text-sm font-medium leading-6 text-foreground">
              Advanced Link Access Options
            </span>
          </AccordionTrigger>
          <AccordionContent className="first:pt-5">
            <EmailAuthenticationSection
              {...{ data, setData }}
              hasFreePlan={hasFreePlan}
              handleUpgradeStateChange={handleUpgradeStateChange}
            />
            <AllowListSection
              {...{ data, setData }}
              hasFreePlan={hasFreePlan}
              handleUpgradeStateChange={handleUpgradeStateChange}
            />
            <DenyListSection
              {...{ data, setData }}
              hasFreePlan={hasFreePlan}
              handleUpgradeStateChange={handleUpgradeStateChange}
            />
            <PasswordSection {...{ data, setData }} />
            <ScreenshotProtectionSection
              {...{ data, setData }}
              hasFreePlan={isNotBusiness}
              handleUpgradeStateChange={handleUpgradeStateChange}
            />
            <FeedbackSection {...{ data, setData }} />
            <QuestionSection
              {...{ data, setData }}
              hasFreePlan={isNotBusiness}
              handleUpgradeStateChange={handleUpgradeStateChange}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {hasFreePlan || isNotBusiness ? (
        <UpgradePlanModal
          clickedPlan={upgradePlan}
          open={openUpgradeModal}
          setOpen={setOpenUpgradeModal}
          trigger={trigger}
        />
      ) : null}
    </div>
  );
};
