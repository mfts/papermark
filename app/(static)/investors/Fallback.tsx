import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";
import PlaceholderImg from "@/public/_static/placeholder.png";
import PapermarkPImg from "@/public/_static/papermark-p.svg";
import { GlobeIcon } from "lucide-react";

const stages = [
  { id: "7", label: "All" },
  { id: "5", label: "Pre-Seed" },
  { id: "1", label: "Seed" },
  { id: "2", label: "Series A" },
  { id: "3", label: "Series B" },
  { id: "4", label: "Series C" },
];

export const FallbackInvestors = async ({allInvestors}: {allInvestors: any[]}) => {

  const category = "7";

  const pageSize = 10; // Showing 10 investors per page
  const totalPages = Math.ceil(allInvestors.length / pageSize);

  const currentPage = 1;

  const indexOfLastInvestor = 10;
  const indexOfFirstInvestor = indexOfLastInvestor - 10;
  const paginatedInvestors = allInvestors.slice(
    indexOfFirstInvestor,
    indexOfLastInvestor,
  );

  return (
    <>
      <div className="sm:flex flex-col md:flex-row justify-between mt-4">
        <span className="isolate mt-5 inline-flex rounded-md shadow-sm w-fit px-2 lg:px-2 ">
          {stages.map((stage) => (
            <Link
              href={
                stage.id !== "7"
                  ? `/investors?category=${stage.id}`
                  : "/investors"
              }
              key={stage.id}
              className={cn(
                category === stage.id || (!category && stage.id === "7")
                  ? "bg-gray-200"
                  : "bg-white hover:bg-gray-50",
                "relative inline-flex items-center first-of-type:rounded-l-md last-of-type:rounded-r-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 focus:z-10 focus:outline-none focus:ring-gray-500 -ml-px first-of-type:-ml-0",
              )}
            >
              {stage.label}
            </Link>
          ))}
        </span>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle px-6 lg:px-8">
            <div className="py-2">
              <span className="font-bold">{allInvestors.length}</span>{" "}
              investors
            </div>
            <div className="overflow-hidden md:shadow md:ring-1 md:ring-black md:ring-opacity-5 rounded-lg">
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
                      Stage
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Location
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Sector
                    </th>
                  </tr>
                </thead>
                <tbody className="md:divide-y divide-gray-200 md:bg-white grid grid-cols-1 gap-3 sm:grid-cols-2 md:table-row-group">
                  {paginatedInvestors.map((investor: any) => (
                    <tr
                      key={investor.id}
                      className="group grid grid-cols-3 gap-1 md:table-row bg-white rounded-lg md:rounded-none md:bg-transparent shadow md:shadow-none border border-gray-200 md:border-x-0 py-3 px-2 md:p-0"
                    >
                      <td className="col-span-3 whitespace-nowrap pl-3 md:py-2 md:pl-6 text-sm sm:pl-6 md:h-24">
                        <div className="flex items-center space-x-2">
                          <div className="h-10 w-10 flex-shrink-0">
                            {investor.imageUrl ? (
                              <img
                                className="rounded-full h-10 w-10 object-contain"
                                width={40}
                                height={40}
                                src={
                                  investor.imageUrl !== ""
                                    ? investor.imageUrl
                                    : PlaceholderImg
                                }
                                alt={investor.name}
                              />
                            ) : (
                              <Image
                                className="rounded-full h-10 w-10 object-contain"
                                width={40}
                                height={40}
                                src={PlaceholderImg}
                                alt={investor.name}
                              />
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="font-medium text-gray-900">
                              {investor.name}
                            </div>
                            <div className="flex space-x-2 items-center">
                              {investor.website && (
                                <a
                                  className="text-black"
                                  href={`${investor.website}?ref=papermark.io`}
                                  target="_blank"
                                  rel="noopener"
                                >
                                  <span className="sr-only">Website</span>
                                  <GlobeIcon className="w-4 h-4" />
                                </a>
                              )}
                              <Link
                                href={`https://www.papermark.io?ref=investors-list`}
                              >
                                <Image
                                  src={PapermarkPImg}
                                  width={18}
                                  height={18}
                                  alt="Papermark"
                                  className="block ring-1 ring-gray-300 rounded-full"
                                />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="col-span-1 row-start-2 whitespace-nowrap px-3 md:px-2 md:py-3 text-sm text-gray-500 font-bold md:font-normal">
                        {investor.round ? investor.round : "Unknown"}
                      </td>
                      <td className="col-span-3 whitespace-nowrap px-3 md:px-2 md:py-3 text-sm text-gray-500 md:mt-0">
                        {investor.location ? investor.location : "Unknown"}
                      </td>
                      <td className="col-span-3 md:max-w-xs px-3 md:px-2 md:py-3 text-sm text-gray-500 truncate w-40">
                        {investor.sector ? investor.sector : "Unknown"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between items-center w-full my-4 px-4">
                <button
                  disabled={currentPage === 1}
                  className="px-2 py-2 rounded border text-xs"
                >
                  Previous
                </button>
                <div className="px-2 py-2 rounded  text-xs">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  className="px-2 py-2 rounded border text-xs"
                >
                  Next
                </button>
              </div>
              {allInvestors.length === 0 && (
                <div className="text-center my-10">No results found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}