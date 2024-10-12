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
  brand,
  useCustomAccessForm,
}: {
  data: DEFAULT_ACCESS_FORM_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_ACCESS_FORM_TYPE>>;
  agreementContent: string;
  agreementName: string;
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
  useCustomAccessForm?: boolean;
}) {
  const handleCheckChange = (checked: boolean) => {
    setData((prevData) => ({ ...prevData, hasConfirmedAgreement: checked }));
  };

  return (
    <div className="pb-5">
      <div className="relative flex items-start space-x-2">
        <Checkbox
          id="agreement"
          onCheckedChange={handleCheckChange}
          className="mt-0.5 border border-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-white data-[state=checked]:bg-black data-[state=checked]:text-white"
        />
        <label
          className="text-sm font-normal leading-5 text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          style={{
            color:
              brand && brand.accentColor
                ? determineTextColor(brand.accentColor)
                : "white",
          }}
        >
          I have reviewed and agree to the terms of this{" "}
          <a
            href={`${agreementContent}`}
            target="_blank"
            rel="noreferrer noopener"
            className="underline hover:text-gray-200"
            style={{
              color:
                brand && brand.accentColor
                  ? determineTextColor(brand.accentColor)
                  : "white",
            }}
          >
            {agreementName}
          </a>
          .
        </label>
      </div>
    </div>
  );
}
