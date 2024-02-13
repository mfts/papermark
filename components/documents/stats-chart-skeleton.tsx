import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";

const StatsChartSkeleton = ({ className }: { className?: string }) => {
  return (
    <section className={cn("px-4 border-l border-b rounded-bl-lg", className)}>
      <div className="flex items-center justify-end">
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex justify-start items-end space-x-8">
        <div className="flex flex-col">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton className="w-10 h-4 rounded-sm my-[18px]" key={i} />
          ))}
        </div>
        <div className="w-full flex items-end space-x-4 sm:space-x-5 md:space-x-8">
          {[250, 200, 150, 100, 50, 20].map((item, i) => (
            <Skeleton
              className="w-16 sm:w-20 md:w-28 !rounded-t-lg rounded-b-none"
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
