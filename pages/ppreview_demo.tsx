import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useRouter } from "next/router";

export default function ViewPage() {
  const router = useRouter();
  const { brandLogo, brandColor, accentColor } = router.query as {
    brandLogo: string;
    brandColor: string;
    accentColor: string;
  };

  return (
    <>
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
                <div className="flex flex-shrink-0 items-center relative h-8 w-36">
                  {brandLogo ? (
                    <img
                      className="object-contain"
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
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0 space-x-4">
                <div className="bg-gray-900 text-white rounded-md h-10 px-4 py-2 items-center flex text-sm font-medium">
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
          className="flex items-center relative"
        >
          <div className="flex items-center justify-between w-full absolute z-10 px-2">
            <button className="relative h-[calc(100vh - 64px)] px-2 py-24  focus:z-20 ">
              <span className="sr-only">Previous</span>
              <div className="bg-gray-950/50 hover:bg-gray-950/75 rounded-full relative flex items-center justify-center p-1">
                <ChevronLeftIcon
                  className="h-10 w-10 text-white"
                  aria-hidden="true"
                />
              </div>
            </button>
            <button className="relative h-[calc(100vh - 64px)] px-2 py-24  focus:z-20">
              <span className="sr-only">Next</span>
              <div className="bg-gray-950/50 hover:bg-gray-950/75 rounded-full relative flex items-center justify-center p-1">
                <ChevronRightIcon
                  className="h-10 w-10 text-white"
                  aria-hidden="true"
                />
              </div>
            </button>
          </div>

          <div className="flex justify-center mx-auto relative h-full w-full">
            <img
              className="object-contain mx-auto block"
              src={"/_example/papermark-example-page.png"}
              alt={`Demo Page 1`}
            />
          </div>
        </div>
      </div>
    </>
  );
}
