import { Skeleton } from "../ui/skeleton";

export default function StatsCardSkeleton() {
  return (
    <div className="border border-foreground/5 py-6 px-4 sm:px-6 lg:px-8 rounded-lg">
      <Skeleton className="h-6 w-[80%] rounded-sm" />
      <Skeleton className="mt-4 h-8 w-9" />
    </div>
  );
}
