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
      className="border border-foreground/5 py-6 px-6 xl:px-8 rounded-lg overflow-hidden"
    >
      <div
        className={cn(
          "flex sm:flex-col lg:flex-row items-center sm:items-start lg:items-center space-x-2 sm:space-x-0 sm:space-y-2 lg:space-y-0 lg:space-x-2",
          !stat.active
            ? "text-gray-300 dark:text-gray-700"
            : "text-muted-foreground",
        )}
      >
        <p className="text-sm font-medium leading-6 whitespace-nowrap capitalize">
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
