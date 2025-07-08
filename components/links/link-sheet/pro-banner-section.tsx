import { useEffect, useState } from "react";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";
import { LinkUpgradeOptions } from "./link-options";

export function ProBannerSection({
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
  const { showBanner } = data;
  const [enabled, setEnabled] = useState<boolean>(showBanner);

  useEffect(() => {
    setEnabled(showBanner);
  }, [showBanner]);

  const handleShowBanner = () => {
    const updatedShowBanner = !enabled;
    setData({ ...data, showBanner: updatedShowBanner });
    setEnabled(updatedShowBanner);
  };

  return (
    <div className="pb-5">
      <LinkItem
        title="Show Visitor Statistics & Papermark Branding"
        enabled={enabled}
        action={handleShowBanner}
        isAllowed={isAllowed}
        requiredPlan="pro"
        upgradeAction={() =>
          handleUpgradeStateChange({
            state: true,
            trigger: "link_sheet_hide_pro_banner_section",
            plan: "Pro",
            highlightItem: ["branding"],
          })
        }
      />
    </div>
  );
}
