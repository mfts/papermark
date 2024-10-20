import { useRouter } from "next/router";

import { BookmarkPlus } from "lucide-react";

import AppLayout from "@/components/layouts/app";
import { Button } from "@/components/ui/button";

export default function PitchDeckID() {
  const router = useRouter();
  return (
    <>
      <AppLayout>
        <div className="min-h-screen overflow-x-hidden bg-white dark:bg-gray-900">
          <div className="sticky top-0 z-50 p-4 pb-0 sm:mx-4 sm:pt-8">
            <section className="mb-4 flex items-center justify-between space-x-2 sm:space-x-0 md:mb-8 lg:mb-12">
              <div className="space-y-0 sm:space-y-1">
                <h5 className="text-base font-semibold tracking-tight text-foreground sm:text-2xl">
                  {`Template Name`}
                </h5>
                <p className="text-xs leading-4 text-muted-foreground sm:text-sm sm:leading-none">
                  {`Template Description`}
                </p>
                <div>
                  <span className="text-md leading-2 text-muted-foreground sm:text-sm sm:leading-none">
                    <strong>Category</strong> : {`template category`}{" "}
                    <strong>Industry</strong> : {`template industry`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-x-1">
                <Button
                  className="group flex flex-1 items-center justify-start gap-x-1 whitespace-nowrap px-1 text-left sm:gap-x-3 sm:px-3"
                  title="Bookmark This Template"
                >
                  <BookmarkPlus
                    className="h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-xs sm:text-base">
                    Bookmark This Template
                  </span>
                </Button>
              </div>
            </section>
            <div className="mb-8 grid grid-cols-1 items-center gap-3 md:flex-row">


            </div>
            {/* <p>Post: {router.query.slug}</p> */}
          </div>
        </div>
      </AppLayout>
    </>
  );
}
