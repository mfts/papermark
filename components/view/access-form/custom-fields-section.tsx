import { Brand, CustomField, DataroomBrand } from "@prisma/client";
import { E164Number } from "libphonenumber-js";

import { cn } from "@/lib/utils";
import { determineTextColor } from "@/lib/utils/determine-text-color";

import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";

export default function CustomFieldsSection({
  fields,
  data,
  setData,
  brand,
}: {
  fields: Partial<CustomField>[];
  data: { [key: string]: string };
  setData: (data: { [key: string]: string }) => void;
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
}) {
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    identifier: string,
  ) => {
    setData({ ...data, [identifier]: e.target.value });
  };

  const handlePhoneChange = (value: E164Number | null, identifier: string) => {
    setData({ ...data, [identifier]: value || "" });
  };

  if (!fields?.length) return null;

  return (
    <div className="space-y-5">
      {fields.map((field, index) => {
        if (!field.identifier) return null;

        const value = data[field.identifier] || "";
        const isLongText = field.type === "LONG_TEXT";
        const isPhoneNumber = field.type === "PHONE_NUMBER";

        return (
          <div key={field.identifier} className="relative space-y-2">
            <label
              htmlFor={field.identifier}
              className="block text-sm font-medium leading-6 text-white"
              style={{
                color: determineTextColor(brand?.accentColor),
              }}
            >
              {field.label}
            </label>
            {isPhoneNumber ? (
              <PhoneInput
                id={field.identifier}
                value={value as E164Number}
                onChange={(phoneValue) =>
                  handlePhoneChange(phoneValue, field.identifier!)
                }
                placeholder={field.placeholder || "+1 123 456 7890"}
                defaultCountry="US"
                disabled={field.disabled}
                translate="no"
                className={cn(
                  "notranslate flex w-full rounded-md border-0 bg-black text-gray-500 placeholder:text-gray-400 sm:text-sm sm:leading-6",
                )}
                style={
                  {
                    "--phone-input-bg":
                      brand && brand.accentColor ? brand.accentColor : "black",
                    "--phone-input-color": determineTextColor(
                      brand?.accentColor,
                    ),
                  } as React.CSSProperties
                }
              />
            ) : (
              (() => {
                const InputComponent = isLongText ? Textarea : Input;
                return (
                  <InputComponent
                    name={field.identifier || ""}
                    id={field.id || ""}
                    type={
                      field.type === "NUMBER"
                        ? "number"
                        : field.type === "URL"
                          ? "url"
                          : "text"
                    }
                    pattern={field.type === "URL" ? "https://.*" : undefined}
                    onInvalid={(e) => {
                      if (field.type === "URL") {
                        e.currentTarget.setCustomValidity(
                          "Please enter a valid URL starting with https://",
                        );
                      }
                    }}
                    onInput={(e) => e.currentTarget.setCustomValidity("")}
                    autoComplete="off"
                    data-1p-ignore
                    required={field.required}
                    disabled={field.disabled}
                    translate="no"
                    className={cn(
                      "notranslate flex w-full rounded-md border-0 bg-black py-1.5 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6",
                      isLongText && "min-h-[100px] resize-none",
                    )}
                    style={{
                      backgroundColor:
                        brand && brand.accentColor
                          ? brand.accentColor
                          : "black",
                      color: determineTextColor(brand?.accentColor),
                    }}
                    value={value}
                    placeholder={field.placeholder || ""}
                    onChange={(e) => handleInputChange(e, field.identifier!)}
                  />
                );
              })()
            )}
          </div>
        );
      })}
    </div>
  );
}
