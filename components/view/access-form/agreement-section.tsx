import { Dispatch, SetStateAction, useEffect } from "react";

import { Checkbox } from "@/components/ui/checkbox";

import { DEFAULT_ACCESS_FORM_TYPE } from ".";

export default function AgreementSection({
  data,
  setData,
  agreementContent,
}: {
  data: DEFAULT_ACCESS_FORM_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_ACCESS_FORM_TYPE>>;
  agreementContent: string;
}) {
  const handleCheckChange = (checked: boolean) => {
    setData((prevData) => ({ ...prevData, hasConfirmedAgreement: checked }));
  };

  return (
    <div className="pb-5">
      <div className="relative flex items-start space-x-2 rounded-md shadow-sm">
        <Checkbox
          id="agreement"
          onCheckedChange={handleCheckChange}
          className="mt-0.5 border border-gray-400  focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-white data-[state=checked]:bg-black data-[state=checked]:text-white"
        />
        <label className="text-sm font-normal leading-5 text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          I have reviewed and agree to the terms of this{" "}
          <a
            href={`${agreementContent}`}
            target="_blank"
            rel="noreferrer noopener"
            className=" underline hover:text-gray-200"
          >
            Non-Disclosure Agreement
          </a>
          .
        </label>
      </div>
    </div>
  );
}
