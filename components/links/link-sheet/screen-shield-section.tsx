import { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";
import { LinkUpgradeOptions } from "./link-options";

export default function ScreenShieldSection({
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
  }: LinkUpgradeOptions) => void;
}) {
  const { screenShieldPercentage } = data;
  const [enabled, setEnabled] = useState<boolean>(!!screenShieldPercentage);

  useEffect(() => {
    setEnabled(!!screenShieldPercentage);
  }, [screenShieldPercentage]);

  const handleEnableScreenShield = () => {
    const updatedEnabled = !enabled;
    setData({
      ...data,
      screenShieldPercentage: updatedEnabled ? 35 : null, // Default to 35% when enabling
    });
    setEnabled(updatedEnabled);
  };

  return (
    <div className="pb-5">
      <LinkItem
        title="Enable Screen Shield"
        tooltipContent="Add a draggable shield that limits the visible area of your content"
        enabled={enabled}
        action={handleEnableScreenShield}
        isAllowed={isAllowed}
        requiredPlan="business"
        upgradeAction={() =>
          handleUpgradeStateChange({
            state: true,
            trigger: "link_sheet_screen_shield_section",
            plan: "Business",
          })
        }
      />

      {enabled && (
        <div className="mt-4 space-y-3">
          <div className="space-y-2">
            <Label>Visible Area</Label>
            <Select
              value={String(screenShieldPercentage)}
              onValueChange={(value) =>
                setData({
                  ...data,
                  screenShieldPercentage: parseInt(value),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20% - Most Restrictive</SelectItem>
                <SelectItem value="35">35% - Recommended</SelectItem>
                <SelectItem value="50">50% - Most Permissive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
