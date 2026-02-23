import { Dispatch, SetStateAction, useEffect } from "react";
import type { CSSProperties } from "react";

import { Brand, DataroomBrand } from "@prisma/client";

import { DEFAULT_ACCESS_FORM_TYPE } from ".";
import { useAccessFormTheme } from "./access-form-theme";

export default function NameSection({
  data,
  setData,
  brand,
}: {
  data: DEFAULT_ACCESS_FORM_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_ACCESS_FORM_TYPE>>;
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
}) {
  const { name } = data;
  const theme = useAccessFormTheme();

  useEffect(() => {
    // Load name from localStorage when the component mounts
    const storedName = window.localStorage.getItem("papermark.name");
    if (storedName) {
      setData((prevData) => ({
        ...prevData,
        name: storedName,
      }));
    }
  }, [setData]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    // Store the new email in localStorage
    window.localStorage.setItem("papermark.name", newName);
    // Update the state
    setData({ ...data, name: newName });
  };

  return (
    <div className="relative space-y-2 rounded-md shadow-sm">
      <label
        htmlFor="name"
        className="block text-sm font-medium leading-6 text-white"
        style={{ color: theme.textColor }}
      >
        Name
      </label>
      <input
        name="name"
        id="name"
        type="text"
        autoCorrect="off"
        autoComplete="off"
        autoFocus
        translate="no"
        className="notranslate flex w-full cursor-text rounded-md border-0 bg-black py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-[var(--access-placeholder)] focus:ring-2 focus:ring-inset focus:ring-[var(--access-input-focus)] sm:text-sm sm:leading-6"
        style={{
          backgroundColor: theme.controlBgColor,
          borderColor: theme.controlBorderColor,
          "--access-placeholder": theme.controlPlaceholderColor,
          "--access-input-focus": theme.controlBorderStrongColor,
          color: theme.textColor,
        } as CSSProperties}
        value={name || ""}
        placeholder="Enter your full name"
        onChange={handleNameChange}
        aria-invalid="true"
        data-1p-ignore
      />
    </div>
  );
}
