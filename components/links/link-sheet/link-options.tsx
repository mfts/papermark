import { Dispatch, SetStateAction } from "react";
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
import AddWatermarkSection from "./add-watermark-section";

export const LinkOptions = ({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
}) => {
  return (
    <div>
      <EmailProtectionSection {...{ data, setData }} />
      <AllowNotificationSection {...{ data, setData }} />
      <AllowDownloadSection {...{ data, setData }} />
      <ExpirationSection {...{ data, setData }} />

      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="py-0 rounded-lg space-x-2">
            <span className="text-sm font-medium leading-6 text-foreground">
              Advanced Link Access Options
            </span>
          </AccordionTrigger>
          <AccordionContent className="first:pt-5">
            <EmailAuthenticationSection {...{ data, setData }} />
            <AllowListSection {...{ data, setData }} />
            <DenyListSection {...{ data, setData }} />
            <PasswordSection {...{ data, setData }} />
            <AddWatermarkSection {...{ data, setData }} />
            <OGSection {...{ data, setData }} />
            <FeedbackSection {...{ data, setData }} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
