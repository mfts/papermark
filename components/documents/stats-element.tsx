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
      className={cn(
        statIdx % 2 === 1 ? "sm:border-l" : statIdx === 2 ? "lg:border-l" : "",
        "border-t border-foreground/5 py-6 px-4 sm:px-6 lg:px-8",
      )}
    >
      <p
        className={cn(
          !stat.active
            ? "text-gray-300 dark:text-gray-700"
            : "text-muted-foreground",
          "text-sm font-medium leading-6",
        )}
      >
        {stat.name}
      </p>
      <p className="mt-2 flex items-baseline gap-x-2">
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
