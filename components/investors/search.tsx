import { Dispatch, SetStateAction } from "react";

import SearchIcon from "@/components/shared/icons/search";

export default function SearchBar({
  search,
  setSearch,
}: {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
}) {
  return (
    <div className="relative mt-5">
      <SearchIcon
        className="absolute bottom-2 left-3 z-20 h-5 w-5"
        aria-hidden="true"
      />
      <input
        type="text"
        id="search"
        name="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="xs:pl-12 relative inline-flex w-full items-center rounded-xl border border-gray-300 px-4 py-2 pl-10 text-sm text-gray-700 shadow-sm placeholder:text-gray-400 focus:z-10 focus:outline-none focus:ring-gray-500 md:w-72"
        placeholder="Search by name"
      />
    </div>
  );
}
