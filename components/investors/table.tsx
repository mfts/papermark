import Image from "next/image";

import { type Investor } from "@/app/(static)/open-source-investors/page";

import WebsiteIcon from "@/components/shared/icons/globe";
import TwitterIcon from "@/components/shared/icons/twitter";

import { cn } from "@/lib/utils";

export default function Table({ investors }: { investors: Investor[] }) {
  return (
    <div>
      <table className="min-w-full divide-gray-300 overflow-hidden rounded-lg bg-gray-100 md:divide-y md:rounded-none md:bg-transparent">
        <thead className="hidden bg-gray-50 md:table-header-group">
          <tr>
            <th
              scope="col"
              className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
            >
              Name
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Company
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Title
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Check Size
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Investments
            </th>
          </tr>
        </thead>
        <tbody className="grid grid-cols-1 gap-3 divide-gray-200 sm:grid-cols-2 md:table-row-group md:divide-y md:bg-white">
          {investors.map((person: Investor) => (
            <tr
              key={person.id}
              className="grid grid-cols-3 gap-1 rounded-lg border border-gray-200 bg-white px-2 py-3 shadow md:table-row md:rounded-none md:border-x-0 md:bg-transparent md:p-0 md:shadow-none"
            >
              <td className="col-span-3 h-24 whitespace-nowrap pl-3 text-sm sm:pl-6 md:py-2 md:pl-6">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0">
                    <Image
                      className="rounded-full"
                      width={40}
                      height={40}
                      src={person.fields.twitterImageUrl}
                      alt="twitter avatar"
                    />
                  </div>
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">
                      {person.fields.name}
                    </div>
                    <div className="mt-1 flex items-center space-x-2">
                      {person.fields.twitterUrl && (
                        <a
                          className="text-black"
                          href={person.fields.twitterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="sr-only">Twitter</span>
                          <TwitterIcon className="h-4 w-4" />
                        </a>
                      )}
                      {person.fields.websiteUrl && (
                        <a
                          className="text-black"
                          href={person.fields.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="sr-only">Website</span>
                          <WebsiteIcon className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </td>
              <td className="col-span-1 row-start-2 whitespace-nowrap px-3 text-sm font-bold text-gray-500 md:px-2 md:py-3 md:font-normal">
                {person.fields.company ?? "Unknown"}
              </td>
              <td className="col-span-3 -mt-2 whitespace-nowrap px-3 text-sm text-gray-500 md:mt-0 md:px-2 md:py-3">
                {person.fields.title ?? "Software Engineer"}
              </td>
              <td className="col-span-3 row-start-2 justify-self-end whitespace-nowrap px-0 text-sm text-gray-500 md:px-2 md:py-3">
                <span
                  className={cn(
                    person.fields.checkSize === "Unknown"
                      ? "bg-gray-100 text-gray-800"
                      : person.fields.checkSize === "$5k - $50k"
                        ? "bg-green-100 text-green-800"
                        : person.fields.checkSize === "$50k+"
                          ? "bg-blue-100 text-blue-800"
                          : person.fields.checkSize === "$100k+"
                            ? "bg-purple-100 text-purple-800"
                            : person.fields.checkSize === "$250k+"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-orange-100 text-orange-800",
                    "inline-flex rounded-full px-[9px] py-[2px] text-xs font-semibold leading-5",
                  )}
                >
                  {person.fields.checkSize}
                </span>
              </td>
              <td className="col-span-3 px-3 text-sm text-gray-500 md:max-w-xs md:px-2 md:py-3">
                {person.fields.openSourceInvestments ?? "Unknown"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {investors.length === 0 && (
        <div className="my-10 text-center">No results found</div>
      )}
    </div>
  );
}
