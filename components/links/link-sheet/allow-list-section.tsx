import { useEffect, useState } from "react";

import { LinkPreset } from "@prisma/client";
import { motion } from "motion/react";

import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/constants";
import { sanitizeAllowDenyList } from "@/lib/utils";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { DEFAULT_LINK_TYPE } from ".";
import AccessGroupSection from "./access-group-section";
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
  const { emailProtected, allowList, allowAccessGroupId } = data;

  // Initialize enabled state based on whether allowList is not null and not empty OR group is selected
  const [enabled, setEnabled] = useState<boolean>(
    (!!allowList && allowList.length > 0) || !!allowAccessGroupId,
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

  useEffect(() => {
    if (isAllowed && presets) {
      // Load preset data if available
      if (presets.allowList && presets.allowList.length > 0) {
        setEnabled(true);
        setAllowListInput(presets.allowList.join("\n") || "");
      }

      // Load access group ID from preset
      if (presets.allowAccessGroupId) {
        setEnabled(true);
        setData((prevData) => ({
          ...prevData,
          allowAccessGroupId: presets.allowAccessGroupId,
        }));
      }
    }
  }, [presets, isAllowed, setData]);

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
        allowAccessGroupId: null,
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
          tooltipContent="Restrict access to a selected group of viewers. Choose an allow list group or enter individual emails/domains. Manage groups in Settings → Access Control."
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
            className="mt-1 block w-full space-y-4"
            {...FADE_IN_ANIMATION_SETTINGS}
          >
            {/* Access Group Selection */}
            <AccessGroupSection
              type="ALLOW"
              data={data}
              setData={setData}
              isAllowed={isAllowed}
              groupIdField="allowAccessGroupId"
            />

            {/* Individual Emails Section */}
            <div className="space-y-2">
              <Label>
                Additional Individual Emails/Domains{" "}
                {!allowAccessGroupId && "(Required)"}
              </Label>
              <Textarea
                className="focus:ring-inset"
                rows={5}
                placeholder={`Enter additional allowed emails/domains, one per line, e.g.
marc@papermark.io
@example.org`}
                value={allowListInput}
                onChange={handleAllowListChange}
              />
              <p className="text-xs text-muted-foreground">
                {allowAccessGroupId
                  ? "Add individual emails/domains in addition to the selected group."
                  : "Enter allowed emails/domains, one per line. Use @domain.com format to allow entire domains."}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}