import { useRouter } from "next/router";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export default function ViewPage() {
  const router = useRouter();
  const { brandLogo, brandColor, accentColor } = router.query as {
    brandLogo: string;
    brandColor: string;
    accentColor: string;
  };

  return (
    <div className="bg-gray-950" style={{ backgroundColor: accentColor }}>
      {/* Nav */}
      <nav
        className="bg-black"
        style={{
          backgroundColor: brandColor,
        }}
      >
        <div className="mx-auto px-2 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">
            <div className="flex flex-1 items-stretch justify-start">
              <div className="relative flex h-16 w-36 flex-shrink-0 items-center overflow-y-hidden">
                {brandLogo ? (
                  <img
                    className="w-full object-contain"
                    src={brandLogo}
                    alt="Logo"
                  />
                ) : (
                  <div className="text-2xl font-bold tracking-tighter text-white">
                    Papermark
                  </div>
                )}
              </div>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center space-x-4 pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
              <div className="flex h-10 items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white">
                <span>1</span>
                <span className="text-gray-400"> / 13</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Body */}
      <div
        style={{ height: "calc(100vh - 64px)" }}
        className="relative flex items-center"
      >
        <div className="absolute z-10 flex w-full items-center justify-between px-2">
          <button className="h-[calc(100vh - 64px)] relative px-2 py-24 focus:z-20">
            <span className="sr-only">Previous</span>
            <div className="relative flex items-center justify-center rounded-full bg-gray-950/50 p-1 hover:bg-gray-950/75">
              <ChevronLeftIcon
                className="h-10 w-10 text-white"
                aria-hidden="true"
              />
            </div>
          </button>
          <button className="h-[calc(100vh - 64px)] relative px-2 py-24 focus:z-20">
            <span className="sr-only">Next</span>
            <div className="relative flex items-center justify-center rounded-full bg-gray-950/50 p-1 hover:bg-gray-950/75">
              <ChevronRightIcon
                className="h-10 w-10 text-white"
                aria-hidden="true"
              />
            </div>
          </button>
        </div>

        <div className="relative mx-auto flex h-full w-full justify-center">
          <img
            className="mx-auto block object-contain"
            src={"/_example/papermark-example-page.png"}
            alt={`Demo Page 1`}
          />
        </div>
      </div>
    </div>
  );
}
