import { Dispatch, SetStateAction, useState } from "react";

import { Brand, DataroomBrand } from "@prisma/client";

import Eye from "@/components/shared/icons/eye";
import EyeOff from "@/components/shared/icons/eye-off";

import { determineTextColor } from "@/lib/utils/determine-text-color";

import { DEFAULT_ACCESS_FORM_TYPE } from ".";

export default function PasswordSection({
  data,
  setData,
  brand,
}: {
  data: DEFAULT_ACCESS_FORM_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_ACCESS_FORM_TYPE>>;
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
}) {
  const { password } = data;
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <div className="space-y-2 rounded-md shadow-sm">
      <label
        htmlFor="password"
        className="block text-sm font-medium leading-6 text-white"
        style={{
          color: determineTextColor(brand?.accentColor),
        }}
      >
        Passcode
      </label>
      <div className="relative">
        <input
          name="password"
          id="password"
          type={showPassword ? "text" : "password"}
          autoCorrect="off"
          autoComplete="off"
          className="flex w-full rounded-md border-0 bg-black py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6"
          style={{
            backgroundColor:
              brand && brand.accentColor ? brand.accentColor : "black",
            color: determineTextColor(brand?.accentColor),
          }}
          value={password || ""}
          placeholder="Enter passcode"
          onChange={(e) => {
            setData({ ...data, password: e.target.value });
          }}
          aria-invalid="true"
          data-1p-ignore
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center pr-3"
        >
          {showPassword ? (
            <Eye className="h-4 w-4 text-gray-400" aria-hidden="true" />
          ) : (
            <EyeOff className="h-4 w-4 text-gray-400" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
