import { Dispatch, SetStateAction, useEffect } from "react";

import { DEFAULT_ACCESS_FORM_TYPE } from ".";

export default function EmailSection({
  data,
  setData,
}: {
  data: DEFAULT_ACCESS_FORM_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_ACCESS_FORM_TYPE>>;
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
      <div className="relative space-y-2 rounded-md shadow-sm">
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
          autoCorrect="off"
          autoComplete="email"
          autoFocus
          className="flex w-full rounded-md border-0 bg-black py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6"
          value={email || ""}
          placeholder="Enter email"
          onChange={handleEmailChange}
          aria-invalid="true"
          data-1p-ignore
        />
        <p className="text-sm text-gray-600">
          This data will be shared with the sender.
        </p>
      </div>
    </div>
  );
}
