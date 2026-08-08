import { useEffect, useState } from "react";

import { DEFAULT_LINK_TYPE } from "@/components/links/link-sheet";
import LinkItem from "@/components/links/link-sheet/link-item";

type ConfidentialViewSectionProps = {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
  isAllowed: boolean;
  handleUpgradeStateChange: ({
    state,
    trigger,
    plan,
    highlightItem,
  }: {
    state: boolean;
    trigger: string;
    plan?: "Pro" | "Business" | "Data Rooms" | "Data Rooms Plus";
    highlightItem?: string[];
  }) => void;
};

export default function ConfidentialViewSection({
  data,
  setData,
  isAllowed,
  handleUpgradeStateChange,
}: ConfidentialViewSectionProps) {
  const { enableConfidentialView } = data;
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    setEnabled(enableConfidentialView);
  }, [enableConfidentialView]);

  const handleToggle = () => {
    const nextValue = !enabled;
    setData({ ...data, enableConfidentialView: nextValue });
    setEnabled(nextValue);
  };

  return (
    <div className="pb-5">
      <LinkItem
        title="Confidential view"
        enabled={enabled}
        action={handleToggle}
        isAllowed={isAllowed}
        requiredPlan="business"
        tooltipContent="Hide the viewer until the visitor confirms they are authorized to access the content."
        link="https://www.papermark.com/help/article/confidential-view"
        upgradeAction={() =>
          handleUpgradeStateChange({
            state: true,
            trigger: "link_sheet_confidential_view_section",
            plan: "Business",
            highlightItem: ["confidential-view"],
          })
        }
      />
    </div>
  );
}