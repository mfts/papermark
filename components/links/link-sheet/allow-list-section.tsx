import { useEffect, useState } from "react";

import { motion } from "motion/react";

import { Textarea } from "@/components/ui/textarea";

import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/constants";
import { sanitizeAllowDenyList } from "@/lib/utils";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";
import { LinkUpgradeOptions } from "./link-options";

export default function AllowListSection({
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
  const { emailProtected, allowList } = data;

  // Initialize enabled state based on whether allowList is not null and not empty
  const [enabled, setEnabled] = useState<boolean>(
    !!allowList && allowList.length > 0,
  );
  const [allowListInput, setAllowListInput] = useState<string>(
    allowList?.join("\n") || "",
  );

  useEffect(() => {
    // Update the allowList in the data state when their inputs change
    const newAllowList = sanitizeAllowDenyList(allowListInput);
    setEnabled((prevEnabled) => prevEnabled && emailProtected);
    setData((prevData) => ({
      ...prevData,
      allowList: emailProtected && enabled ? newAllowList : [],
    }));
  }, [allowListInput, emailProtected, enabled, setData]);

  const handleEnableAllowList = () => {
    const updatedEnabled = !enabled;
    setEnabled(updatedEnabled);

    if (updatedEnabled) {
      setData((prevData) => ({
        ...prevData,
        allowList: updatedEnabled ? sanitizeAllowDenyList(allowListInput) : [],
        emailAuthenticated: true, // Turn on email authentication
        emailProtected: true, // Turn on email protection
      }));
    } else {
      setData((prevData) => ({
        ...prevData,
        allowList: [],
      }));
    }
  };

  const handleAllowListChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setAllowListInput(event.target.value);
  };

  return (
    <div className="pb-5">
      <div className="flex flex-col space-y-4">
        <LinkItem
          title="Allow specified viewers"
          link="https://www.papermark.io/help/article/allow-list"
          tooltipContent="Restrict access to a selected group of viewers. Enter allowed emails or domains."
          enabled={enabled}
          isAllowed={isAllowed}
          action={handleEnableAllowList}
          requiredPlan="business"
          upgradeAction={() =>
            handleUpgradeStateChange({
              state: true,
              trigger: "link_sheet_allowlist_section",
              plan: "Business",
            })
          }
        />

        {enabled && (
          <motion.div
            className="mt-1 block w-full"
            {...FADE_IN_ANIMATION_SETTINGS}
          >
            <Textarea
              className="focus:ring-inset"
              rows={5}
              placeholder="Enter allowed emails/domains, one per line, e.g.                                      marc@papermark.io                                                                                   @example.org"
              value={allowListInput}
              onChange={handleAllowListChange}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
