import { classNames } from "@/lib/utils";

export default function StatsElementPlaceholder({
  statIdx,
}: {
  statIdx: number;
}) {
  return (
    <div
      className={classNames(
        statIdx % 2 === 1 ? "sm:border-l" : statIdx === 2 ? "lg:border-l" : "",
        "border-t border-foreground/5 py-6 px-4 sm:px-6 lg:px-8",
      )}
    >
      <div className="h-4 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
      <div className="mt-4 flex gap-x-2">
        <div className="h-8 w-8 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>
  );
}
