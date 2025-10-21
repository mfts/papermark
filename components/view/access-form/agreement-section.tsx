import { Dispatch, SetStateAction } from "react";

import { Brand, DataroomBrand } from "@prisma/client";

import { determineTextColor } from "@/lib/utils/determine-text-color";

import { Checkbox } from "@/components/ui/checkbox";

import { DEFAULT_ACCESS_FORM_TYPE } from ".";

export default function AgreementSection({
  data,
  setData,
  agreementContent,
  agreementName,
  agreementContentType,
  brand,
  useCustomAccessForm,
}: {
  data: DEFAULT_ACCESS_FORM_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_ACCESS_FORM_TYPE>>;
  agreementContent: string;
  agreementName: string;
  agreementContentType?: string;
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
  useCustomAccessForm?: boolean;
}) {
  const handleCheckChange = (checked: boolean) => {
    setData((prevData) => ({ ...prevData, hasConfirmedAgreement: checked }));
  };

  const isTextContent = agreementContentType === "TEXT";

  return (
    <div className="relative flex items-start space-x-2 pt-5">
      <Checkbox
        id="agreement"
        onCheckedChange={handleCheckChange}
        className="border border-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[var(--dynamic-accent-color)] data-[state=checked]:bg-[var(--dynamic-accent-color)] data-[state=checked]:text-[var(--dynamic-accent-color)]"
        style={
          {
            borderColor: determineTextColor(brand?.accentColor),
            color: brand?.accentColor || undefined,
            "--dynamic-accent-color": determineTextColor(brand?.accentColor),
          } as React.CSSProperties
        }
      />
      <label
        className="text-sm font-normal leading-5 text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        style={{
          color: determineTextColor(brand?.accentColor),
        }}
      >
        {isTextContent ? (
          <span className="whitespace-pre-line">{agreementContent}</span>
        ) : (
          <>
            I have reviewed and agree to the terms of this{" "}
            <a
              href={`${agreementContent}`}
              target="_blank"
              rel="noreferrer noopener"
              className="underline hover:text-gray-200"
              style={{
                color: determineTextColor(brand?.accentColor),
              }}
            >
              {agreementName}
            </a>
            .
          </>
        )}
      </label>
    </div>
  );
}
