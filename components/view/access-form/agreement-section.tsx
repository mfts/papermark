import { Dispatch, SetStateAction } from "react";

import { Brand, DataroomBrand } from "@prisma/client";

import { Checkbox } from "@/components/ui/checkbox";

import { DEFAULT_ACCESS_FORM_TYPE } from ".";
import { useAccessFormTheme } from "./access-form-theme";

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
  const theme = useAccessFormTheme();
  const isChecked = !!data.hasConfirmedAgreement;

  const handleCheckChange = (checked: boolean) => {
    setData((prevData) => ({ ...prevData, hasConfirmedAgreement: checked }));
  };
  const toggleAgreement = () => {
    handleCheckChange(!isChecked);
  };

  const isTextContent = agreementContentType === "TEXT";

  return (
    <div className="relative flex items-start space-x-2 pt-5">
      <Checkbox
        id="agreement"
        checked={isChecked}
        onCheckedChange={handleCheckChange}
        className="border border-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[var(--agreement-checked-bg)] data-[state=checked]:bg-[var(--agreement-checked-bg)] data-[state=checked]:text-[var(--agreement-check-color)]"
        style={
          {
            borderColor: theme.controlBorderStrongColor,
            color: theme.backgroundColor || undefined,
            "--agreement-checked-bg": theme.textColor,
            "--agreement-check-color": theme.inverseTextColor,
          } as React.CSSProperties
        }
      />
      <label
        className="text-sm font-normal leading-5 text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        style={{ color: theme.textColor }}
      >
        {isTextContent ? (
          <span
            className="cursor-pointer whitespace-pre-line"
            onClick={toggleAgreement}
          >
            {agreementContent}
          </span>
        ) : (
          <>
            <span className="cursor-pointer" onClick={toggleAgreement}>
              I have reviewed and agree to the terms of this{" "}
            </span>
            <a
              href={`${agreementContent}`}
              target="_blank"
              rel="noreferrer noopener"
              className="underline hover:text-gray-200"
              onClick={(e) => e.stopPropagation()}
              style={{ color: theme.textColor }}
            >
              {agreementName}
            </a>
            <span className="cursor-pointer" onClick={toggleAgreement}>
              .
            </span>
          </>
        )}
      </label>
    </div>
  );
}
