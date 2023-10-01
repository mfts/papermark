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
        className="h-5 w-5 absolute z-20 left-3 bottom-2"
        aria-hidden="true"
      />
      <input
        type="text"
        id="search"
        name="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl shadow-sm inline-flex relative items-center border border-gray-300 px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:z-10 focus:outline-none focus:ring-gray-500 md:w-72 pl-10 xs:pl-12"
        placeholder="Search by name"
      />
    </div>
  );
}
