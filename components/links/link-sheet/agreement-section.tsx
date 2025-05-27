import { useEffect, useMemo, useState } from "react";

import { Agreement, LinkPreset } from "@prisma/client";
import { motion } from "motion/react";

import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/constants";
import { useAgreements } from "@/lib/swr/use-agreements";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DEFAULT_LINK_TYPE } from ".";
import AgreementSheet from "./agreement-panel";
import LinkItem from "./link-item";
import { LinkUpgradeOptions } from "./link-options";

export default function AgreementSection({
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
    highlightItem,
  }: LinkUpgradeOptions) => void;
}) {
  const { agreements } = useAgreements();
  const { enableAgreement, agreementId, emailProtected } = data;
  const [enabled, setEnabled] = useState<boolean>(false);
  const [isAgreementSheetVisible, setIsAgreementSheetVisible] =
    useState<boolean>(false);

  const filteredAgreements = useMemo(
    () =>
      agreements.filter(
        (agreement: Agreement) =>
          !agreement.deletedAt || agreement.id === agreementId,
      ),
    [agreements, agreementId],
  );

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
      <LinkItem
        title="Require NDA to view"
        link="https://www.papermark.com/help/article/require-nda-to-view"
        tooltipContent="Users must acknowledge an agreement to access the content."
        enabled={enabled}
        action={handleAgreement}
        isAllowed={isAllowed}
        requiredPlan="datarooms"
        upgradeAction={() =>
          handleUpgradeStateChange({
            state: true,
            trigger: "link_sheet_agreement_section",
            plan: "Data Rooms",
            highlightItem: ["nda"],
          })
        }
      />

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
                  {filteredAgreements &&
                    filteredAgreements.map(({ id, name }) => (
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
