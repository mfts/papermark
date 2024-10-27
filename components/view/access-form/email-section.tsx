import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

import { Brand, DataroomBrand } from "@prisma/client";
import { useDebouncedCallback } from "use-debounce";

import { cn } from "@/lib/utils";
import { determineTextColor } from "@/lib/utils/determine-text-color";
import { simpleEmailRegex, validateEmail } from "@/lib/utils/validate-email";

import { DEFAULT_ACCESS_FORM_TYPE } from ".";

export default function EmailSection({
  data,
  setData,
  brand,
  disableEditEmail,
  useCustomAccessForm,
  onValidationChange,
}: {
  data: DEFAULT_ACCESS_FORM_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_ACCESS_FORM_TYPE>>;
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
  disableEditEmail?: boolean;
  useCustomAccessForm?: boolean;
  onValidationChange: (isValid: boolean) => void;
}) {
  const { email } = data;
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

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

  const handleInvalid = (e: React.InvalidEvent<HTMLInputElement>) => {
    e.preventDefault(); // Prevent default browser validation popup
    setEmailError("Please enter a valid email address");
  };

  const debouncedValidation = useDebouncedCallback(
    (value: string) => {
      const isValid = !value || validateEmail(value);
      if (isDirty && value && !isValid) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError(null);
      }
      // Notify parent component about validation status
      onValidationChange?.(isValid);
    },
    500, // 500ms delay
  );

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value.toLowerCase();
    setEmailError(null); // Clear error when typing

    debouncedValidation(newEmail);

    // Update the state
    setData({ ...data, email: newEmail });
    // Store in localStorage
    window.localStorage.setItem("papermark.email", newEmail);

    // Optional: Clear error if input becomes valid
    if (e.target.validity.valid) {
      setEmailError(null);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsDirty(true);
    const value = e.target.value;
    const isValid = !value || validateEmail(value);
    if (value && !isValid) {
      setEmailError("Please enter a valid email address");
    }
    onValidationChange?.(isValid);
  };

  const handleFocus = () => {
    // Optionally clear error when user focuses the input to type again
    setEmailError(null);
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
          required
          className={cn(
            "flex w-full rounded-md border-0 bg-black py-1.5 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6",
            emailError && isDirty && "ring-red-500",
          )}
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
          onInvalid={handleInvalid}
          onBlur={handleBlur}
          onFocus={handleFocus}
          disabled={disableEditEmail}
          pattern={simpleEmailRegex.source}
          data-1p-ignore
          aria-invalid={emailError ? "true" : "false"}
          aria-describedby={emailError ? "email-error" : undefined}
        />
        {emailError && (
          <p
            id="email-error"
            className="mt-1 text-sm text-red-500"
            style={{
              color: brand?.accentColor
                ? determineTextColor(brand.accentColor)
                : "rgb(239 68 68)",
            }}
          >
            {emailError}
          </p>
        )}
        <p className="text-sm text-gray-500">
          {useCustomAccessForm
            ? "This data will be shared with the content provider."
            : "This data will be shared with the sender."}
        </p>
      </div>
    </div>
  );
}
