import Image from "next/image";
import TwitterIcon from "@/components/shared/icons/twitter";
import WebsiteIcon from "@/components/shared/icons/globe";
import { cn } from "@/lib/utils";

interface Investor {
  id: string;
  createdTime: string;
  fields: Fields;
}

interface Fields {
  name: string;
  type: string;
  title: string;
  company: string;
  twitterUrl: string;
  websiteUrl: string;
  twitterImageUrl: string;
  openSourceInvestments: string;
  checkSize: "Unknown" | "$5k - $50k" | "$50k+" | "$100k+" | "$250k+";
}

export default function Table({ investors }: { investors: Investor[] }) {
  return (
    <div>
      <table className="min-w-full md:divide-y bg-gray-100 md:bg-transparent divide-gray-300 rounded-lg overflow-hidden md:rounded-none">
        <thead className="bg-gray-50 hidden md:table-header-group">
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
        <tbody className="md:divide-y divide-gray-200 md:bg-white grid grid-cols-1 gap-3 sm:grid-cols-2 md:table-row-group">
          {investors.map((person: Investor) => (
            <tr
              key={person.id}
              className="grid grid-cols-3 gap-1 md:table-row bg-white rounded-lg md:rounded-none md:bg-transparent shadow md:shadow-none border border-gray-200 md:border-x-0 py-3 px-2 md:p-0"
            >
              <td className="col-span-3 whitespace-nowrap pl-3 md:py-2 md:pl-6 text-sm sm:pl-6 h-24">
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
                    <div className="flex space-x-2 items-center mt-1">
                      {person.fields.twitterUrl && (
                        <a
                          className="text-black"
                          href={person.fields.twitterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="sr-only">Twitter</span>
                          <TwitterIcon className="w-4 h-4" />
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
                          <WebsiteIcon className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </td>
              <td className="col-span-1 row-start-2 whitespace-nowrap px-3 md:px-2 md:py-3 text-sm text-gray-500 font-bold md:font-normal">
                {person.fields.company ?? "Unknown"}
              </td>
              <td className="col-span-3 whitespace-nowrap px-3 md:px-2 md:py-3 text-sm text-gray-500 -mt-2 md:mt-0">
                {person.fields.title ?? "Software Engineer"}
              </td>
              <td className="col-span-3 row-start-2 whitespace-nowrap px-0 md:px-2 md:py-3 text-sm text-gray-500 justify-self-end">
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
              <td className="col-span-3 md:max-w-xs px-3 md:px-2 md:py-3 text-sm text-gray-500">
                {person.fields.openSourceInvestments ?? "Unknown"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {investors.length === 0 && (
        <div className="text-center my-10">No results found</div>
      )}
    </div>
  );
}
