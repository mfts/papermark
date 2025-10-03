import { Dispatch, SetStateAction, useEffect } from "react";

import { Brand, DataroomBrand } from "@prisma/client";

import { determineTextColor } from "@/lib/utils/determine-text-color";

import { DEFAULT_ACCESS_FORM_TYPE } from ".";

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
        style={{
          color: determineTextColor(brand?.accentColor),
        }}
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
        className="notranslate flex w-full rounded-md border-0 bg-black py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6"
        style={{
          backgroundColor:
            brand && brand.accentColor ? brand.accentColor : "black",
          color: determineTextColor(brand?.accentColor),
        }}
        value={name || ""}
        placeholder="Enter your full name"
        onChange={handleNameChange}
        aria-invalid="true"
        data-1p-ignore
      />
    </div>
  );
}
