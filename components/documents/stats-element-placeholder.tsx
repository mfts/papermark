import { classNames } from "@/lib/utils";

export default function StatsElementPlaceholder({ key }: { key: number }) {
  return (
    <div
      className={classNames(
        key % 2 === 1 ? "sm:border-l" : key === 2 ? "lg:border-l" : "",
        "border-t border-white/5 py-6 px-4 sm:px-6 lg:px-8"
      )}
    >
      <div className="h-4 w-full animate-pulse rounded-md bg-gray-800" />
      <div className="mt-4 flex gap-x-2">
        <div className="h-8 w-8 animate-pulse rounded-md bg-gray-800" />
      </div>
    </div>
  );
}
