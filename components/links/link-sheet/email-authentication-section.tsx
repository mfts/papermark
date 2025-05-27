import { useEffect, useState } from "react";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";
import { LinkUpgradeOptions } from "./link-options";

export default function EmailAuthenticationSection({
  data,
  setData,
  isAllowed,
  handleUpgradeStateChange,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
  isAllowed: boolean;
  handleUpgradeStateChange: ({
    state,
    trigger,
    plan,
    highlightItem,
  }: LinkUpgradeOptions) => void;
}) {
  const { emailProtected, emailAuthenticated, enableConversation } = data;
  const [enabled, setEnabled] = useState<boolean>(emailAuthenticated);

  useEffect(() => {
    setEnabled(emailAuthenticated);
  }, [emailAuthenticated]);

  const handleEnableAuthentication = () => {
    const updatedEmailAuthentication = !enabled;
    setData({
      ...data,
      emailProtected: updatedEmailAuthentication ? true : emailProtected,
      emailAuthenticated: updatedEmailAuthentication,
      enableConversation: updatedEmailAuthentication
        ? enableConversation
        : false,
    });
    setEnabled(updatedEmailAuthentication);
  };

  return (
    <div className="pb-5">
      <LinkItem
        title="Require email verification"
        link="https://www.papermark.com/help/article/require-email-verification"
        tooltipContent="Users must verify their email before accessing the content."
        enabled={enabled}
        action={handleEnableAuthentication}
        isAllowed={isAllowed}
        requiredPlan="business"
        upgradeAction={() =>
          handleUpgradeStateChange({
            state: true,
            trigger: "link_sheet_email_auth_section",
            plan: "Business",
            highlightItem: ["email-verify"],
          })
        }
      />
    </div>
  );
}
