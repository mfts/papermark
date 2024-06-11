import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { motion } from "framer-motion";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/constants";
import { useAgreements } from "@/lib/swr/use-agreements";
import { cn } from "@/lib/utils";

import { DEFAULT_LINK_TYPE } from ".";
import AgreementSheet from "./agreement-panel";

export default function AgreementSection({
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
    plan?: "Pro" | "Business" | "Data Rooms",
  ) => void;
}) {
  const { agreements } = useAgreements();
  const { enableAgreement, agreementId, emailProtected } = data;
  const [enabled, setEnabled] = useState<boolean>(false);
  const [isAgreementSheetVisible, setIsAgreementSheetVisible] =
    useState<boolean>(false);

  useEffect(() => {
    setEnabled(enableAgreement!);
  }, [enableAgreement]);

  const handleAgreement = async () => {
    const updatedAgreement = !enabled;

    setData({
      ...data,
      enableAgreement: updatedAgreement,
      emailProtected: updatedAgreement ? true : emailProtected,
    });
    setEnabled(updatedAgreement);
  };

  const handleAgreementChange = (value: string) => {
    if (value === "add_agreement") {
      // Open the agreement sheet
      setIsAgreementSheetVisible(true);
      return;
    }

    setData({ ...data, agreementId: value });
  };

  return (
    <div className="pb-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between space-x-2">
          <h2
            className={cn(
              "flex items-center gap-x-2 text-sm font-medium leading-6",
              enabled ? "text-foreground" : "text-muted-foreground",
              hasFreePlan ? "cursor-pointer" : undefined,
            )}
            onClick={
              hasFreePlan
                ? () =>
                    handleUpgradeStateChange(
                      true,
                      "link_sheet_agreement_section",
                      "Data Rooms",
                    )
                : undefined
            }
          >
            Require NDA to view
            {/* <span>
              <HelpCircleIcon className="text-muted-foreground h-4 w-4" />
            </span> */}
            {hasFreePlan && (
              <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs text-foreground ring-1 ring-gray-800 dark:ring-gray-500">
                Datarooms
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
                    "link_sheet_agreement_section",
                    "Data Rooms",
                  )
              : undefined
          }
          className={hasFreePlan ? "opacity-50" : undefined}
          onCheckedChange={hasFreePlan ? undefined : handleAgreement}
        />
      </div>

      {enabled && (
        <motion.div
          className="relative mt-4 space-y-3"
          {...FADE_IN_ANIMATION_SETTINGS}
        >
          <div className="flex w-full flex-col items-start gap-6 overflow-x-visible pb-4 pt-0">
            <div className="w-full space-y-2">
              <Select
                onValueChange={handleAgreementChange}
                defaultValue={agreementId ?? ""}
              >
                <SelectTrigger className="focus:ring-offset-3 flex w-full rounded-md border-0 bg-background py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-gray-400 sm:text-sm sm:leading-6">
                  <SelectValue placeholder="Select an agreement" />
                </SelectTrigger>
                <SelectContent>
                  {agreements &&
                    agreements.map(({ id, name }) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                  <SelectItem key="add_agreement" value="add_agreement">
                    Add new agreement
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>
      )}

      <AgreementSheet
        isOpen={isAgreementSheetVisible}
        setIsOpen={setIsAgreementSheetVisible}
      />
    </div>
  );
}
