"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useMemo, useState } from "react";

import Fuse from "fuse.js";

import SearchBar from "@/components/investors/search";
import Stats from "@/components/investors/stats";
import InvestorTable from "@/components/investors/table";

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
      <Stats angelsLength={angels.length} />
      <div className="mt-4 flex-col justify-between sm:flex md:flex-row">
        <span className="isolate mt-5 inline-flex w-fit rounded-md shadow-sm">
          {checkSizes.map((checkSize) => (
            <Link
              href={
                checkSize.id !== "7"
                  ? `/open-source-investors/?category=${checkSize.id}`
                  : "/open-source-investors"
              }
              key={checkSize.id}
              className={cn(
                category === checkSize.id || (!category && checkSize.id === "7")
                  ? "bg-gray-200"
                  : "bg-white hover:bg-gray-50",
                "relative -ml-px inline-flex items-center border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 first-of-type:-ml-0 first-of-type:rounded-l-md last-of-type:rounded-r-md focus:z-10 focus:outline-none focus:ring-gray-500",
              )}
            >
              {checkSize.label}
            </Link>
          ))}
        </span>
        <SearchBar search={search} setSearch={setSearch} />
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full px-6 py-2 align-middle lg:px-8">
            <div className="overflow-hidden rounded-lg md:shadow md:ring-1 md:ring-black md:ring-opacity-5">
              <InvestorTable investors={angels} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
