import { Dispatch, SetStateAction, useState } from "react";
import Eye from "@/components/shared/icons/eye";
import EyeOff from "@/components/shared/icons/eye-off";
import { DEFAULT_ACCESS_FORM_TYPE } from ".";

export default function PasswordSection({
  data,
  setData,
}: {
  data: DEFAULT_ACCESS_FORM_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_ACCESS_FORM_TYPE>>;
}) {
  const { password } = data;
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <div className="pb-5">
      <div className="rounded-md shadow-sm space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium leading-6 text-white"
        >
          Passcode
        </label>
        <div className="relative">
          <input
            name="password"
            id="password"
            type={showPassword ? "text" : "password"}
            className="flex w-full rounded-md border-0 py-1.5 text-white bg-black shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6"
            value={password || ""}
            placeholder="Enter passcode"
            onChange={(e) => {
              setData({ ...data, password: e.target.value });
            }}
            aria-invalid="true"
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
    </div>
  );
}
