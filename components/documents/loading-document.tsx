import { Skeleton } from "../ui/skeleton";

export function LoadingDocuments({ count }: { count: number }) {
  return (
    <ul role="list" className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="relative flex w-full items-center space-x-3 rounded-lg border px-4 py-5 sm:px-6 lg:px-6"
        >
          <Skeleton key={i} className="h-9 w-9" />
          <div>
            <Skeleton key={i} className="h-4 w-32" />
            <Skeleton key={i + 1} className="mt-2 h-3 w-12" />
          </div>
          <Skeleton
            key={i + 1}
            className="absolute right-5 top-[50%] h-5 w-20 -translate-y-[50%] transform"
          />
        </li>
      ))}
    </ul>
  );
}
