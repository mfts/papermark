import { Dispatch, SetStateAction } from "react";
import { DEFAULT_ACCESS_FORM_TYPE } from ".";

export default function EmailSection({
  data,
  setData,
}: {
  data: DEFAULT_ACCESS_FORM_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_ACCESS_FORM_TYPE>>;
}) {
  const { email } = data;

  return (
    <div className="pb-5">
      <div className="relative rounded-md shadow-sm space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium leading-6 text-white"
        >
          Email address
        </label>
        <input
          name="email"
          id="email"
          type="email"
          autoComplete="email"
          className="flex w-full rounded-md border-0 py-1.5 text-white bg-black shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6"
          value={email || ""}
          placeholder="Enter email"
          onChange={(e) => {
            setData({ ...data, email: e.target.value });
          }}
          aria-invalid="true"
        />
        <p className="text-sm text-gray-600">
          This data will be shared with the sender.
        </p>
      </div>
    </div>
  );
}
