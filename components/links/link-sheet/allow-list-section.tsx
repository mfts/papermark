import Link from "next/link";

import { useEffect, useState } from "react";

import { LinkPreset } from "@prisma/client";
import { motion } from "motion/react";

import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/constants";
import { useAllowListGroupsAll } from "@/lib/swr/use-allow-list-groups";
import { sanitizeList } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const { emailProtected, allowList, allowListGroupId } = data;
  const { allowListGroups, loading: isLoadingGroups } = useAllowListGroupsAll();
  const [showAllEmails, setShowAllEmails] = useState<boolean>(false);

  const [enabled, setEnabled] = useState<boolean>(
    (!!allowList && allowList.length > 0) || !!allowListGroupId,
  );
  const [allowListInput, setAllowListInput] = useState<string>(
    allowList?.join("\n") || "",
  );

  const selectedGroup = allowListGroups?.find(
    (group) => group.id === allowListGroupId,
  );

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
        allowListGroupId: null,
      }));
    }
  };

  const handleGroupSelection = (selectedGroupId: string) => {
    if (selectedGroupId === "none") {
      setData((prevData) => ({
        ...prevData,
        allowListGroupId: null,
      }));
    } else {
      setData((prevData) => ({
        ...prevData,
        allowListGroupId: selectedGroupId,
      }));
    }
  };

  useEffect(() => {
    if (isAllowed && presets) {
      // Load preset data if available
      if (presets.allowList && presets.allowList.length > 0) {
        setEnabled(true);
        setAllowListInput(presets.allowList.join("\n") || "");
      }

      if (presets.allowListGroupId) {
        setEnabled(true);
        setData((prevData) => ({
          ...prevData,
          allowListGroupId: presets.allowListGroupId,
        }));
      }
    }
  }, [presets, isAllowed, setData]);

  useEffect(() => {
    const newAllowList = sanitizeList(allowListInput);
    setData((prevData) => ({
      ...prevData,
      allowList: emailProtected && enabled ? newAllowList : [],
    }));
  }, [allowListInput, emailProtected, enabled, setData]);

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
            className="mt-1 block w-full space-y-4"
            {...FADE_IN_ANIMATION_SETTINGS}
          >
            {/* Loading State */}
            {isLoadingGroups && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Allow List Group (Optional)</Label>
                  <Link
                    href="/visitors?tab=allow-lists"
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Manage
                  </Link>
                </div>
                <div className="rounded-md border border-dashed p-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    Loading groups...
                  </p>
                </div>
              </div>
            )}

            {isAllowed &&
              !isLoadingGroups &&
              (!allowListGroups || allowListGroups.length === 0) && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Allow List Group (Optional)</Label>
                    <Link
                      href="/visitors?tab=allow-lists"
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Manage
                    </Link>
                  </div>
                  <div className="rounded-md border border-dashed p-3 text-center">
                    <p className="text-sm text-muted-foreground">
                      No allow list groups created yet.{" "}
                      <Link
                        href={`/visitors?tab=allow-lists`}
                        className="font-medium text-primary hover:underline"
                      >
                        Create your first group
                      </Link>{" "}
                      to reuse the same allow list across multiple links.
                    </p>
                  </div>
                </div>
              )}

            {/* Group Selection */}
            {!isLoadingGroups &&
              allowListGroups &&
              allowListGroups.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Allow List Group (Optional)</Label>
                    <Link
                      href="/visitors?tab=allow-lists"
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Manage
                    </Link>
                  </div>
                  <Select
                    value={allowListGroupId || "none"}
                    onValueChange={handleGroupSelection}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an allow list group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No group selected</SelectItem>
                      {allowListGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          <div className="flex w-full items-center justify-between">
                            <span>{group.name}</span>
                            <Badge variant="secondary" className="ml-2">
                              {group.allowList.length}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedGroup && (
                    <div className="text-xs text-muted-foreground">
                      <div className="mt-1">
                        {(showAllEmails
                          ? selectedGroup.allowList
                          : selectedGroup.allowList.slice(0, 3)
                        ).map((email, i, arr) => (
                          <span key={i} className="font-mono">
                            {email}
                            {i < arr.length - 1 && ", "}
                          </span>
                        ))}
                        {selectedGroup.allowList.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setShowAllEmails(!showAllEmails)}
                            className="ml-1 font-medium text-primary hover:underline"
                          >
                            {showAllEmails
                              ? "show less"
                              : `and ${selectedGroup.allowList.length - 3} more`}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* Individual Emails/Domains */}
            <div className="space-y-2">
              <Label htmlFor="allowListInput">
                Additional Emails & Domains
              </Label>
              <Textarea
                id="allowListInput"
                className="focus:ring-inset"
                rows={5}
                placeholder={`Enter additional allowed emails/domains, one per line, e.g.
marc@papermark.io
@example.org`}
                value={allowListInput}
                onChange={handleAllowListChange}
              />
              <p className="text-xs text-muted-foreground">
                These will be combined with any selected group above.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
