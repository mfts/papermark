import { Dispatch, SetStateAction } from "react";

import { Brand, DataroomBrand } from "@prisma/client";

import { Checkbox } from "@/components/ui/checkbox";

import { determineTextColor } from "@/lib/utils/determine-text-color";

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
    <div className="space-y-4 pt-5">
      {/* Display text content if available */}
      {isTextContent && (
        <div 
          className="rounded-md border border-gray-600 bg-gray-900/50 p-4 text-sm leading-relaxed"
          style={{
            color: determineTextColor(brand?.accentColor),
            borderColor: brand?.accentColor ? `${brand.accentColor}40` : "#4b5563"
          }}
        >
          <div className="font-medium mb-2">{agreementName}</div>
          <div className="whitespace-pre-line">{agreementContent}</div>
        </div>
      )}

      <div className="relative flex items-start space-x-2">
        <Checkbox
          id="agreement"
          onCheckedChange={handleCheckChange}
          className="mt-0.5 border border-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-white data-[state=checked]:bg-black data-[state=checked]:text-white"
        />
        <label
          className="text-sm font-normal leading-5 text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          style={{
            color: determineTextColor(brand?.accentColor),
          }}
        >
          {isTextContent ? (
            <>I have reviewed and agree to the terms outlined above.</>
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
    </div>
  );
}
