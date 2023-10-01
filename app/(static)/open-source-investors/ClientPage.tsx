"use client";

import Fuse from "fuse.js";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import InvestorTable from "@/components/investors/table";
import SearchBar from "@/components/investors/search";
import Stats from "@/components/investors/stats";

const searchOptions = {
  threshold: 0.3,
  location: 0,
  distance: 100,
  minMatchCharLength: 2,
  keys: ["fields.name", "fields.twitterUrl", "fields.company", "fields.title", "fields.openSourceInvestments"],
};


export default function Dashboard({ data }: any) {
  const { records: allInvestors } = data;
  const [search, setSearch] = useState("");

  const searchParams = useSearchParams();
  const category = searchParams!.get("category");

  // Define filtered & sorted investor array
  const ALL_INVESTORS = allInvestors
    // .filter((angel: any) => !angel.hidden)
    // .sort(compare)
    // .filter((person: any) => {
    //   return !category ? true : person.checksize_id.toString() === category;
    // });

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
            <h1 className="text-3xl text-gray-800 font-extrabold mx-auto sm:text-6xl max-w-3xl">
              Find the next angel investor for your open-source project
            </h1>
          </div>
        </div>
        <Stats angelsLength={angels.length} />
        <div className="sm:flex flex-col md:flex-row justify-end mt-4">
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
