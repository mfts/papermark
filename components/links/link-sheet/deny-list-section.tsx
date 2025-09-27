import { useEffect, useState } from "react";

import { LinkPreset } from "@prisma/client";
import { motion } from "motion/react";

import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/constants";
import { sanitizeList } from "@/lib/utils";

import { Textarea } from "@/components/ui/textarea";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";
import { LinkUpgradeOptions } from "./link-options";

export default function DenyListSection({
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
  const { emailProtected, denyList } = data;
  // Initialize enabled state based on whether denyList is not null and not empty
  const [enabled, setEnabled] = useState<boolean>(
    !!denyList && denyList.length > 0,
  );
  const [denyListInput, setDenyListInput] = useState<string>(
    denyList?.join("\n") || "",
  );

  useEffect(() => {
    // Update the denyList in the data state when their inputs change
    const newDenyList = sanitizeList(denyListInput);
    setEnabled((prevEnabled) => prevEnabled && emailProtected);
    setData((prevData) => ({
      ...prevData,
      denyList: emailProtected && enabled ? newDenyList : [],
    }));
  }, [denyListInput, enabled, emailProtected, setData]);

  useEffect(() => {
    if (isAllowed && presets?.denyList && presets.denyList.length > 0) {
      setEnabled(true);
      setDenyListInput(presets.denyList?.join("\n") || "");
    }
  }, [presets, isAllowed]);

  const handleEnableDenyList = () => {
    const updatedEnabled = !enabled;
    setEnabled(updatedEnabled);

    if (updatedEnabled) {
      setData((prevData) => ({
        ...prevData,
        denyList: updatedEnabled ? sanitizeList(denyListInput) : [],
        emailAuthenticated: true, // Turn on email authentication
        emailProtected: true, // Turn on email protection
      }));
    } else {
      setData((prevData) => ({
        ...prevData,
        denyList: [],
      }));
    }
  };

  const handleDenyListChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setDenyListInput(event.target.value);
  };

  return (
    <div className="pb-5">
      <div className="flex flex-col space-y-4">
        <LinkItem
          title="Block specified viewers"
          tooltipContent="Prevent certain users from accessing the content. Enter blocked emails or domains."
          enabled={enabled}
          link="https://www.papermark.com/help/article/block-list"
          action={handleEnableDenyList}
          isAllowed={isAllowed}
          requiredPlan="business"
          upgradeAction={() =>
            handleUpgradeStateChange({
              state: true,
              trigger: "link_sheet_denylist_section",
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
              placeholder={`Enter blocked emails/domains, one per line, e.g.
marc@papermark.com
@example.org`}
              value={denyListInput}
              onChange={handleDenyListChange}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
