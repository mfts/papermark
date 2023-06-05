import { classNames } from "@/lib/utils";

export default function StatsCard() {
  const stats = [
    { name: "Number of views", value: 0, active: true },
    {
      name: "Number of unique viewers",
      value: 0,
      active: true,
    },
    {
      name: "Average view duration",
      value: "3.65",
      unit: "mins",
      active: false,
    },
    { name: "TBD", value: "98.5%", active: false },
  ];

  return (
    <div className="grid grid-cols-1 bg-gray-700/10 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, statIdx) => (
        <div
          key={stat.name}
          className={classNames(
            statIdx % 2 === 1
              ? "sm:border-l"
              : statIdx === 2
              ? "lg:border-l"
              : "",
            "border-t border-white/5 py-6 px-4 sm:px-6 lg:px-8"
          )}
        >
          <p
            className={classNames(
              !stat.active ? "text-gray-700" : "text-gray-400",
              "text-sm font-medium leading-6"
            )}
          >
            {stat.name}
          </p>
          <p className="mt-2 flex items-baseline gap-x-2">
            <span
              className={classNames(
                !stat.active ? "text-gray-700" : "text-white",
                "text-4xl font-semibold tracking-tight "
              )}
            >
              {stat.value}
            </span>
            {stat.unit ? (
              <span
                className={classNames(
                  !stat.active ? "text-gray-700" : "text-gray-400",
                  "text-sm"
                )}
              >
                {stat.unit}
              </span>
            ) : null}
          </p>
        </div>
      ))}
    </div>
  );
}
