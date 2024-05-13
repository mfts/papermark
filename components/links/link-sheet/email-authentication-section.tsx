import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { Switch } from "@/components/ui/switch";

import { cn } from "@/lib/utils";

import { DEFAULT_LINK_TYPE } from ".";

export default function EmailAuthenticationSection({
  data,
  setData,
  hasFreePlan,
  handleUpgradeStateChange,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
  hasFreePlan: boolean;
  handleUpgradeStateChange: (state: boolean, trigger: string) => void;
}) {
  const { emailProtected, emailAuthenticated } = data;
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
      allowList: updatedEmailAuthentication ? data.allowList : [],
      denyList: updatedEmailAuthentication ? data.denyList : [],
    });
    setEnabled(updatedEmailAuthentication);
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
                      "link_sheet_email_auth_section",
                    )
                : undefined
            }
          >
            Require email verification
            {hasFreePlan && (
              <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs text-foreground ring-1 ring-gray-800 dark:ring-gray-500">
                Pro
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
                    "link_sheet_email_auth_section",
                  )
              : undefined
          }
          className={hasFreePlan ? "opacity-50" : undefined}
          onCheckedChange={hasFreePlan ? undefined : handleEnableAuthentication}
        />
      </div>
    </div>
  );
}
