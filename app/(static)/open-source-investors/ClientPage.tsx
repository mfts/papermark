"use client";

import Fuse from "fuse.js";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import InvestorTable from "@/components/investors/table";
import SearchBar from "@/components/investors/search";
import Stats from "@/components/investors/stats";
import Link from "next/link";
import { cn } from "@/lib/utils";

const searchOptions = {
  threshold: 0.3,
  location: 0,
  distance: 100,
  minMatchCharLength: 2,
  keys: [
    "fields.name",
    "fields.twitterUrl",
    "fields.company",
    "fields.title",
    "fields.openSourceInvestments",
  ],
};

function compare(a: any, b: any) {
  // Define the order of the checkSize labels
  const checkSizesOrder = [
    "$5k - $50k",
    "$50k+",
    "$100k+",
    "$250k+",
    "Unknown",
  ];

  const orderA = checkSizesOrder.indexOf(a.fields.checkSize);
  const orderB = checkSizesOrder.indexOf(b.fields.checkSize);

  // Ensure that the checkSize exists in our order array. If not, place it at the end.
  if (orderA === -1) return 1;
  if (orderB === -1) return -1;

  // Sort according to the checkSize order
  return orderA - orderB;
}

export default function Dashboard({ data }: any) {
  const { records: allInvestors } = data;
  const [search, setSearch] = useState("");

  const searchParams = useSearchParams();
  const category = searchParams!.get("category");

  const checkSizes = [
    { id: "7", label: "All" },
    { id: "1", label: "$5k - $50k" },
    { id: "2", label: "$50k+" },
    { id: "3", label: "$100k+" },
    { id: "4", label: "$250k+" },
  ];

  const selectedCheckSize = checkSizes.find(
    (checkSize) => checkSize.id === category,
  );
  const labelForSelectedCategory = selectedCheckSize
    ? selectedCheckSize.label
    : null;

  // Define filtered & sorted investor array
  const ALL_INVESTORS = allInvestors
    // .filter((angel: any) => !angel.hidden)
    .sort(compare)
    .filter((person: any) => {
      if (!labelForSelectedCategory || labelForSelectedCategory === "All")
        return true;
      return person.fields.checkSize === labelForSelectedCategory;
    });

  // Fuzzy search with highlighting
  const fuse = new Fuse(ALL_INVESTORS, searchOptions);
  const angels = useMemo(() => {
    if (search.length > 0) {
      return fuse.search(search).map((match) => match.item);
    }
    return ALL_INVESTORS;
  }, [search, ALL_INVESTORS]);

  return (
    <>
      <div className="mx-auto max-w-6xl pt-4 mb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 sm:pt-16 pt-8 text-gray-600">
          <div className="space-y-5 max-w-4xl mx-auto text-center">
            <h1 className="text-3xl text-gray-800 font-extrabold mx-auto sm:text-6xl max-w-3xl tracking-tighter">
              Find the next angel investor for your open-source project
            </h1>
          </div>
        </div>
        <Stats angelsLength={angels.length} />
        <div className="sm:flex flex-col md:flex-row justify-between mt-4">
          <span className="isolate mt-5 inline-flex rounded-md shadow-sm w-fit">
            {checkSizes.map((checkSize) => (
              <Link
                href={
                  checkSize.id !== "7"
                    ? `/open-source-investors/?category=${checkSize.id}`
                    : "/open-source-investors"
                }
                key={checkSize.id}
                className={cn(
                  category === checkSize.id ||
                    (!category && checkSize.id === "7")
                    ? "bg-gray-200"
                    : "bg-white hover:bg-gray-50",
                  "relative inline-flex items-center first-of-type:rounded-l-md last-of-type:rounded-r-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 focus:z-10 focus:outline-none focus:ring-gray-500 -ml-px first-of-type:-ml-0",
                )}
              >
                {checkSize.label}
              </Link>
            ))}
          </span>
          <SearchBar search={search} setSearch={setSearch} />
        </div>
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle px-6 lg:px-8">
              <div className="overflow-hidden md:shadow md:ring-1 md:ring-black md:ring-opacity-5 rounded-lg">
                <InvestorTable investors={angels} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
