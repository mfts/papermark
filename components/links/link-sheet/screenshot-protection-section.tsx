import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { Switch } from "@/components/ui/switch";

import { cn } from "@/lib/utils";

import { DEFAULT_LINK_TYPE } from ".";

export default function ScreenshotProtectionSection({
  data,
  setData,
  hasFreePlan,
  handleUpgradeStateChange,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
  hasFreePlan: boolean;
  handleUpgradeStateChange: (
    state: boolean,
    trigger: string,
    plan?: "Pro" | "Business",
  ) => void;
}) {
  const { enableScreenshotProtection } = data;
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    setEnabled(enableScreenshotProtection);
  }, [enableScreenshotProtection]);

  const handleEnableScreenshotProtection = () => {
    const updatedEnableScreenshotProtection = !enabled;
    setData({
      ...data,
      enableScreenshotProtection: updatedEnableScreenshotProtection,
    });
    setEnabled(updatedEnableScreenshotProtection);
  };

  return (
    <div className="pb-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between space-x-2">
          <h2
            className={cn(
              "text-sm font-medium leading-6",
              enabled ? "text-foreground" : "text-muted-foreground",
              hasFreePlan ? "cursor-pointer" : undefined,
            )}
            onClick={
              hasFreePlan
                ? () =>
                    handleUpgradeStateChange(
                      true,
                      "link_sheet_screenshot_protection_section",
                      "Business",
                    )
                : undefined
            }
          >
            Enable screenshot protection*
            {hasFreePlan && (
              <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs text-foreground ring-1 ring-gray-800 dark:ring-gray-500">
                Business
              </span>
            )}
          </h2>
        </div>
        <Switch
          checked={enabled}
          onClick={
            hasFreePlan
              ? () =>
                  handleUpgradeStateChange(
                    true,
                    "link_sheet_screenshot_protection_section",
                    "Business",
                  )
              : undefined
          }
          className={hasFreePlan ? "opacity-50" : undefined}
          onCheckedChange={
            hasFreePlan ? undefined : handleEnableScreenshotProtection
          }
        />
      </div>
    </div>
  );
}
