import { Dispatch, SetStateAction, useEffect } from "react";

import { Brand, DataroomBrand } from "@prisma/client";

import { cn } from "@/lib/utils";
import { determineTextColor } from "@/lib/utils/determine-text-color";

import { DEFAULT_ACCESS_FORM_TYPE } from ".";

export default function EmailSection({
  data,
  setData,
  brand,
  disableEditEmail,
}: {
  data: DEFAULT_ACCESS_FORM_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_ACCESS_FORM_TYPE>>;
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
  disableEditEmail?: boolean;
}) {
  const { email } = data;

  useEffect(() => {
    // Load email from localStorage when the component mounts
    const storedEmail = window.localStorage.getItem("papermark.email");
    if (storedEmail) {
      setData((prevData) => ({
        ...prevData,
        email: storedEmail.toLowerCase(),
      }));
    }
  }, [setData]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value.toLowerCase();
    // Store the new email in localStorage
    window.localStorage.setItem("papermark.email", newEmail);
    // Update the state
    setData({ ...data, email: newEmail });
  };

  return (
    <div className="pb-5">
      <div className="relative space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium leading-6 text-white"
          style={{
            color:
              brand && brand.accentColor
                ? determineTextColor(brand.accentColor)
                : "white",
          }}
        >
          Email address
        </label>
        <input
          name="email"
          id="email"
          type="email"
          autoCorrect="off"
          autoComplete="email"
          autoFocus
          className="flex w-full rounded-md border-0 bg-black py-1.5 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6"
          style={{
            backgroundColor:
              brand && brand.accentColor ? brand.accentColor : "black",
            color: disableEditEmail
              ? "hsl(var(--muted-foreground))"
              : brand && brand.accentColor
                ? determineTextColor(brand.accentColor)
                : "white",
          }}
          value={email || ""}
          placeholder="Enter email"
          onChange={handleEmailChange}
          disabled={disableEditEmail}
          aria-invalid="true"
          data-1p-ignore
        />
        <p className="text-sm text-gray-500">
          This data will be shared with the sender.
        </p>
      </div>
    </div>
  );
}
