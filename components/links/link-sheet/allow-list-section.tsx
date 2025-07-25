import { useEffect, useState } from "react";

import { LinkPreset } from "@prisma/client";
import { motion } from "motion/react";

import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/constants";
import { sanitizeList } from "@/lib/utils";

import { Textarea } from "@/components/ui/textarea";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";
import { LinkUpgradeOptions } from "./link-options";

export default function AllowListSection({
  data,
  setData,
  isAllowed,
  handleUpgradeStateChange,
  presets,
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
  presets: LinkPreset | null;
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
    const newAllowList = sanitizeList(allowListInput);
    setEnabled((prevEnabled) => prevEnabled && emailProtected);
    setData((prevData) => ({
      ...prevData,
      allowList: emailProtected && enabled ? newAllowList : [],
    }));
  }, [allowListInput, emailProtected, enabled, setData]);

  useEffect(() => {
    if (isAllowed && presets?.allowList && presets.allowList.length > 0) {
      setEnabled(true);
      setAllowListInput(presets.allowList.join("\n") || "");
    }
  }, [presets, isAllowed]);

  const handleEnableAllowList = () => {
    const updatedEnabled = !enabled;
    setEnabled(updatedEnabled);

    if (updatedEnabled) {
      setData((prevData) => ({
        ...prevData,
        allowList: updatedEnabled ? sanitizeList(allowListInput) : [],
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
          link="https://www.papermark.com/help/article/allow-list"
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
              highlightItem: ["allow-block"],
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
              placeholder={`Enter allowed emails/domains, one per line, e.g.
marc@papermark.io
@example.org`}
              value={allowListInput}
              onChange={handleAllowListChange}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
