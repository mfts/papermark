import { cn } from "@/lib/utils";

interface Stat {
  name: string;
  value: string;
  unit?: string;
  active: boolean;
}
interface StatsElementProps {
  stat: Stat;
  statIdx: number;
}

export default function StatsElement({ stat, statIdx }: StatsElementProps) {
  return (
    <div
      key={statIdx}
      className="overflow-hidden rounded-lg border border-foreground/5 px-6 py-6 xl:px-8"
    >
      <div
        className={cn(
          "flex items-center space-x-2 sm:flex-col sm:items-start sm:space-x-0 sm:space-y-2 lg:flex-row lg:items-center lg:space-x-2 lg:space-y-0",
          !stat.active
            ? "text-gray-300 dark:text-gray-700"
            : "text-muted-foreground",
        )}
      >
        <p className="whitespace-nowrap text-sm font-medium capitalize leading-6">
          {stat.name}
        </p>
      </div>

      <p className="mt-3 flex items-baseline gap-x-2">
        <span
          className={cn(
            !stat.active
              ? "text-gray-300 dark:text-gray-700"
              : "text-foreground",
            "text-4xl font-semibold tracking-tight ",
          )}
        >
          {stat.value}
        </span>
        {stat.unit ? (
          <span
            className={cn(
              !stat.active
                ? "text-gray-300 dark:text-gray-700"
                : "text-muted-foreground",
              "text-sm",
            )}
          >
            {stat.unit}
          </span>
        ) : null}
      </p>
    </div>
  );
}
