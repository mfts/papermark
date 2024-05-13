"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useMemo, useState } from "react";

import PapermarkPImg from "@/public/_static/papermark-p.svg";
import PlaceholderImg from "@/public/_static/placeholder.png";
import classNames from "clsx";
import Fuse from "fuse.js";
import { GlobeIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const searchOptions = {
  threshold: 0.3,
  location: 0,
  distance: 100,
  minMatchCharLength: 2,
  keys: ["name", "round", "sector", "website", "location"],
};

const statuses = {
  Active: "text-green-700 bg-green-50 ring-green-600/20",
  Withdraw: "text-gray-600 bg-gray-50 ring-gray-500/10",
  Overdue: "text-red-700 bg-red-50 ring-red-600/10",
};

// function compare(a: any, b: any) {
//   // Define the order of the checkSize labels
//   const checkSizesOrder = [
//     "$5k - $50k",
//     "$50k+",
//     "$100k+",
//     "$250k+",
//     "Unknown",
//   ];

//   const orderA = checkSizesOrder.indexOf(a.fields.checkSize);
//   const orderB = checkSizesOrder.indexOf(b.fields.checkSize);

//   // Ensure that the checkSize exists in our order array. If not, place it at the end.
//   if (orderA === -1) return 1;
//   if (orderB === -1) return -1;

//   // Sort according to the checkSize order
//   return orderA - orderB;
// }

export default function Dashboard({ data }: any) {
  const allInvestors = data;

  const [search, setSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const pageSize = 10; // Showing 10 investors per page
  const totalPages = Math.ceil(allInvestors.length / pageSize);

  const searchParams = useSearchParams();
  const category = searchParams!.get("category");

  // const page = searchParams?.get("page") ?? '1'
  // const per_page = searchParams?.get("per_page") ?? '20'

  // const start = (Number(page) - 1) * Number(per_page) // 0, 5, 10 ...
  // const end = start + Number(per_page) // 5, 10, 15 ...

  const stages = [
    { id: "7", label: "All" },
    { id: "5", label: "Pre-Seed" },
    { id: "1", label: "Seed" },
    { id: "2", label: "Series A" },
    { id: "3", label: "Series B" },
    { id: "4", label: "Series C" },
  ];

  const selectedStage = stages.find((round) => round.id === category);
  const labelForSelectedCategory = selectedStage ? selectedStage.label : null;

  // Define filtered & sorted investor array
  const ALL_INVESTORS = allInvestors
    // .filter((angel: any) => !angel.hidden)
    // .sort(compare)
    .filter((investor: any) => {
      if (!labelForSelectedCategory || labelForSelectedCategory === "All")
        return true;
      return investor.round.includes(labelForSelectedCategory);
    });

  // Fuzzy search with highlighting
  const fuse = new Fuse(ALL_INVESTORS, searchOptions);
  const currentInvestors = useMemo(() => {
    if (search.length > 0) {
      return fuse.search(search).map((match) => match.item);
    }
    return ALL_INVESTORS;
  }, [search, ALL_INVESTORS]);

  // Pagination
  // Function to handle page change
  const goToPage = (pageNumber: React.SetStateAction<number>) => {
    setCurrentPage(pageNumber);
  };

  // Calculate the investors to display on the current page
  const indexOfLastInvestor = currentPage * pageSize;
  const indexOfFirstInvestor = indexOfLastInvestor - pageSize;
  const paginatedInvestors = currentInvestors.slice(
    indexOfFirstInvestor,
    indexOfLastInvestor,
  );

  return (
    <>
      <div className="mt-4 flex-col justify-between sm:flex md:flex-row">
        <span className="isolate mt-5 inline-flex w-fit rounded-md px-2 shadow-sm md:px-0">
          {stages.map((stage) => (
            <Link
              href={
                stage.id !== "7"
                  ? `/investors?category=${stage.id}`
                  : "/investors"
              }
              key={stage.id}
              className={classNames(
                category === stage.id || (!category && stage.id === "7")
                  ? "bg-gray-200"
                  : "bg-white hover:bg-gray-50",
                "relative -ml-px inline-flex items-center border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 first-of-type:-ml-0 first-of-type:rounded-l-md last-of-type:rounded-r-md focus:z-10 focus:outline-none focus:ring-gray-500",
              )}
            >
              {stage.label}
            </Link>
          ))}
        </span>
        <div className="relative mt-5 px-2 md:px-0">
          <SearchIcon
            className="absolute bottom-2 left-3 z-20 ml-1 h-5 w-5 md:ml-0"
            aria-hidden="true"
          />
          <input
            type="text"
            id="search"
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="xs:pl-12 relative inline-flex w-full items-center rounded-xl border border-gray-300 px-4 py-2 pl-10 text-sm text-gray-700 shadow-sm placeholder:text-gray-400 focus:z-10 focus:outline-none focus:ring-gray-500 md:w-72"
            placeholder="Search by name or country"
          />
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full px-6 py-2 align-middle lg:px-8">
            <div className="py-2">
              <span className="font-bold">{currentInvestors.length}</span>{" "}
              investors
            </div>
            <div className="overflow-hidden rounded-lg md:shadow md:ring-1 md:ring-black md:ring-opacity-5">
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
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Fund details
                    </th>
                  </tr>
                </thead>

                <tbody className="grid grid-cols-1 gap-3 divide-gray-200 sm:grid-cols-2 md:table-row-group md:divide-y md:bg-white">
                  {paginatedInvestors.map((investor: any) => (
                    // Assuming you have a slug or some unique identifier for each investor

                    <tr
                      key={investor.id}
                      className="group grid grid-cols-3 gap-1 rounded-lg border border-gray-200 bg-white px-2 py-3 shadow hover:bg-gray-100 md:table-row md:rounded-none md:border-x-0 md:bg-transparent md:p-0 md:shadow-none"
                    >
                      <td className="col-span-3 whitespace-nowrap pl-3 text-sm sm:pl-6 md:h-24 md:py-2 md:pl-6">
                        <div className="flex items-center space-x-2">
                          <div className="h-10 w-10 flex-shrink-0">
                            {investor.imageUrl ? (
                              <img
                                className="h-10 w-10 rounded-full object-contain"
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
                                className="h-10 w-10 rounded-full object-contain"
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
                            <div className="flex items-center space-x-2">
                              {investor.website && (
                                <a
                                  className="text-black"
                                  href={`${investor.website}?ref=papermark.io`}
                                  target="_blank"
                                  rel="noopener"
                                >
                                  <span className="sr-only">Website</span>
                                  <GlobeIcon className="h-4 w-4" />
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
                                  className="block rounded-full ring-1 ring-gray-300"
                                />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="col-span-1 row-start-2 whitespace-nowrap px-3 text-sm font-bold text-gray-500 md:px-2 md:py-3 md:font-normal">
                        {investor.round ? investor.round : "Unknown"}
                      </td>
                      <td className="col-span-3 whitespace-nowrap px-3 text-sm text-gray-500 md:mt-0 md:px-2 md:py-3">
                        {investor.location ? investor.location : "Unknown"}
                      </td>
                      <td className="col-span-3 w-40 truncate px-3 text-sm text-gray-500 md:max-w-xs md:px-2 md:py-3">
                        {investor.sector ? investor.sector : "Unknown"}
                      </td>
                      <td className="col-span-3 w-40 truncate px-3 text-sm text-gray-500 md:max-w-xs md:px-2 md:py-3">
                        <a
                          href={`/investors/${encodeURIComponent(investor.slug)}`}
                        >
                          <Button className="hover:bg-[#fb7a00]] rounded-3xl bg-gray-200 text-xs text-gray-800">
                            Learn more
                          </Button>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="my-4 flex w-full items-center justify-between px-4">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded border px-2 py-2 text-xs"
                >
                  Previous
                </button>
                <div className="rounded px-2 py-2  text-xs">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded border px-2 py-2 text-xs"
                >
                  Next
                </button>
              </div>
              {currentInvestors.length === 0 && (
                <div className="my-10 text-center">No results found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
