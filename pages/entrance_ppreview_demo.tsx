import { useRouter } from "next/router";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { determineTextColor } from "@/lib/utils/determine-text-color";

export default function ViewPage() {
  const router = useRouter();
  const { accentColor, welcomeMessage } = router.query as {
    accentColor: string;
    welcomeMessage?: string;
  };

  return (
    <div className="bg-gray-950" style={{ backgroundColor: accentColor }}>
      <div className="mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="mt-20 flex flex-1 items-stretch justify-center"></div>
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1
            className="mt-16 text-2xl font-bold leading-9 tracking-tight text-white"
            style={{
              color: determineTextColor(accentColor),
            }}
          >
            {welcomeMessage || "Your action is requested to continue"}
          </h1>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          <form className="space-y-4">
            <div className="pb-5">
              <div className="relative space-y-2 rounded-md shadow-sm">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium leading-6 text-white"
                  style={{
                    color: determineTextColor(accentColor),
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
                  className="flex w-full rounded-md border-0 bg-black py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6"
                  style={{ backgroundColor: accentColor }}
                  placeholder="Enter email"
                  aria-invalid="true"
                  data-1p-ignore
                />
                <p className="text-sm text-gray-500">
                  This data will be shared with the sender.
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                type="submit"
                className="w-1/3 min-w-fit bg-white text-gray-950 hover:bg-white/90"
              >
                Continue
              </Button>
            </div>
          </form>
        </div>
      </div>
      {/* </nav> */}

      {/* Body */}
      <div
        style={{ height: "calc(100vh - 64px)" }}
        className="relative flex items-center"
      >
        <div className="relative mx-auto flex h-full w-full justify-center"></div>
      </div>
    </div>
  );
}
