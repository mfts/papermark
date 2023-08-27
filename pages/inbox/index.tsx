import Skeleton from "@/components/Skeleton";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/layouts/app"
import useSavedLinks from "@/lib/swr/use-links";
import Link from "next/link";
import ExternalLink from "@/components/shared/icons/external-link";
import { timeAgo } from "@/lib/utils";


export default function Inbox() {
  const { savedLinks } = useSavedLinks();

  return (
    <AppLayout>
      <div className="p-4 sm:p-4 sm:m-4">
        <div className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h2 className="text-2xl text-white font-semibold tracking-tight">
              Inbox
            </h2>
            <p className="text-sm text-gray-400">
              Never lose a received document again
            </p>
          </div>
          <ul className="flex items-center justify-between gap-4">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-950 bg-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Import Link
            </button>
          </ul>
        </div>

        <Separator className="my-6 bg-gray-700" />

        {savedLinks && savedLinks.length === 0 && (
          <div className="flex items-center justify-center h-96">
            Nothing here yet.
          </div>
        )}

        {/* Link list */}
        <ul role="list" className="space-y-4">
          {savedLinks
            ? savedLinks.map((savedLink) => (
                <li key={savedLink.id} className="group relative rounded-lg bg-gray-800 p-3  sm:p-4 flex justify-between items-center">
                  <div className="min-w-0 flex shrink items-center space-x-4">
                    <div className="flex-col">
                      <div className="flex items-center">
                        <h2 className="min-w-0 text-sm font-semibold leading-6 text-white truncate max-w-[240px] sm:max-w-md">
                          {savedLink.link.document.name}
                        </h2>
                      </div>
                      <div className="mt-1 flex items-center space-x-1 text-xs leading-5 text-gray-400">
                        <p className="truncate">
                          {`Saved document ${timeAgo(savedLink.createdAt)}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/view/${savedLink.link.id}`}
                    target="_blank"
                    className="flex items-center text-sm z-10 space-x-2 rounded-md bg-gray-700 px-2 py-0.5 transition-all duration-75 hover:scale-105 active:scale-100 ring-2 ring-gray-700 group-hover:ring-gray-500"
                  >
                    <span>Visit document</span>
                    <ExternalLink />
                  </Link>
                </li>
              ))
            : Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="flex flex-col space-y-4 px-4 py-4 sm:px-6 lg:px-8"
                >
                  <Skeleton key={i} className="h-5 w-20" />
                  <Skeleton key={i} className="mt-3 h-3 w-10" />
                </li>
              ))}
        </ul>
      </div>
    </AppLayout>
  );
}