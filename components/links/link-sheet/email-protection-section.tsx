import { useEffect, useState } from "react";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";

export default function EmailProtectionSection({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
}) {
  const { emailProtected } = data;
  const [enabled, setEnabled] = useState<boolean>(emailProtected);

  useEffect(() => {
    setEnabled(emailProtected);
  }, [emailProtected]);

  const handleEnableProtection = () => {
    const updatedEmailProtection = !enabled;
    setData({
      ...data,
      emailProtected: updatedEmailProtection,
      emailAuthenticated: !updatedEmailProtection && false,
      enableConversation: !updatedEmailProtection && false,
      enableAgreement: !updatedEmailProtection && false,
      allowList: updatedEmailProtection ? data.allowList : [],
      denyList: updatedEmailProtection ? data.denyList : [],
    });
    setEnabled(updatedEmailProtection);
  };

  return (
    <div className="pb-5">
      <LinkItem
        title="Require email to view"
        link="https://www.papermark.com/help/article/require-email-to-view-document"
        enabled={enabled}
        action={handleEnableProtection}
        tooltipContent="Users must provide an email to access this content"
      />
    </div>
  );
}
