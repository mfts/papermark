import { cn } from "@/lib/utils";

import { Skeleton } from "../ui/skeleton";

const StatsChartSkeleton = ({ className }: { className?: string }) => {
  return (
    <section className={cn("rounded-bl-lg border-b border-l px-4", className)}>
      <div className="flex items-center justify-end">
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex items-end justify-start space-x-8">
        <div className="flex flex-col">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton className="my-[18px] h-4 w-10 rounded-sm" key={i} />
          ))}
        </div>
        <div className="flex w-full items-end space-x-4 sm:space-x-5 md:space-x-8">
          {[250, 200, 150, 100, 50, 20].map((item, i) => (
            <Skeleton
              className="w-16 !rounded-t-lg rounded-b-none sm:w-20 md:w-28"
              style={{ height: `${item}px` }}
              key={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsChartSkeleton;
