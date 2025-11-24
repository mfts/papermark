/**
 * Portions of this file are adapted from dub.co (github.com/dubinc/dub).
 * Copyright (c) Dub, Inc. and contributors. Published under AGPLv3 license.
 * Source: https://github.com/dubinc/dub/blob/aaba1095e692e1756a29808181cca5bbf18ac06d/packages/ui/src/timestamp-tooltip.tsx
 */

"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDuration, intervalToDuration } from "date-fns";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "./tooltip";

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * DAY_MS;

export type TimestampTooltipProps = {
  timestamp: Date | string | number | null | undefined;
  rows?: ("local" | "utc" | "unix")[];
  interactive?: boolean;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  children?: React.ReactNode;
};

function getLocalTimeZone(): string {
  if (typeof Intl !== "undefined") {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";
    } catch (e) {}
  }
  return "Local";
}

export function TimestampTooltip({
  timestamp,
  rows = ["local", "utc"],
  interactive = true,
  side = "top",
  align = "center",
  className,
  children,
}: TimestampTooltipProps) {
  if (!timestamp || new Date(timestamp).toString() === "Invalid Date")
    return <>{children}</>;

  return (
    <Tooltip>
      <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          className={cn("p-0", className)}
          side={side}
          align={align}
          sideOffset={8}
        >
          <TimestampTooltipContent
            timestamp={timestamp}
            rows={rows}
            interactive={interactive}
          />
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
}

function TimestampTooltipContent({
  timestamp,
  rows = ["local", "utc"],
  interactive,
}: Pick<TimestampTooltipProps, "timestamp" | "rows" | "interactive">) {
  if (!timestamp)
    throw new Error("Falsy timestamp not permitted in TimestampTooltipContent");

  const date = new Date(timestamp);
  const commonFormat: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  };

  const diff = new Date().getTime() - date.getTime();
  const relativeDuration = intervalToDuration({
    start: date,
    end: new Date(),
  });

  const relative =
    formatDuration(relativeDuration, {
      delimiter: ", ",
      format: [
        "years",
        "months",
        "days",
        ...(diff < MONTH_MS
          ? [
              "hours" as const,
              ...(diff < DAY_MS
                ? ["minutes" as const, "seconds" as const]
                : []),
            ]
          : []),
      ],
    }) + " ago";

  const items: {
    label: string;
    shortLabel?: string;
    successMessageLabel: string;
    value: string;
    valueMono?: boolean;
  }[] = useMemo(
    () =>
      rows.map(
        (key) =>
          ({
            local: {
              label: getLocalTimeZone(),
              shortLabel: new Date()
                .toLocaleTimeString("en-US", { timeZoneName: "short" })
                .split(" ")[2],
              successMessageLabel: "local timestamp",
              value: date.toLocaleString("en-US", commonFormat),
            },
            utc: {
              label: "UTC",
              shortLabel: "UTC",
              successMessageLabel: "UTC timestamp",
              value: new Date(date.getTime()).toLocaleString("en-US", {
                ...commonFormat,
                timeZone: "UTC",
              }),
            },
            unix: {
              label: "Timestamp",
              successMessageLabel: "timestamp",
              value: Math.floor(date.getTime()).toString(),
              valueMono: true,
            },
          })[key]!,
      ),
    [rows, date],
  );

  const shortLabels = items.every(({ shortLabel }) => shortLabel);

  // Re-render every second to update the relative time
  const [_, setRenderCount] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setRenderCount((c) => c + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex max-w-[360px] flex-col gap-2 px-2.5 py-2 text-left text-xs">
      <table>
        {items.map((row, idx) => (
          <tr
            key={idx}
            className={cn(
              interactive &&
                "relative select-none before:absolute before:-inset-x-1 before:inset-y-0 before:rounded before:bg-muted before:opacity-0 before:content-[''] hover:cursor-copy hover:before:opacity-60 active:before:opacity-100",
            )}
            onClick={
              interactive
                ? async () => {
                    try {
                      await navigator.clipboard.writeText(row.value);
                      toast.success(
                        `Copied ${row.successMessageLabel} to clipboard`,
                      );
                    } catch (e) {
                      toast.error(
                        `Failed to copy ${row.successMessageLabel} to clipboard`,
                      );
                      console.error(
                        `Failed to copy ${row.successMessageLabel} to clipboard`,
                        e,
                      );
                    }
                  }
                : undefined
            }
          >
            <td className="relative py-0.5">
              <span
                className={cn(
                  "truncate text-muted-foreground",
                  shortLabels && "rounded bg-muted px-1 font-mono",
                )}
                title={shortLabels ? row.label : undefined}
              >
                {shortLabels ? row.shortLabel : row.label}
              </span>
            </td>
            <td
              className={cn(
                "relative whitespace-nowrap py-0.5 pl-3 text-foreground",
                shortLabels && "pl-2",
                row.valueMono && "font-mono",
              )}
            >
              {row.value}
            </td>
          </tr>
        ))}
        {diff > 0 && (
          <tr
            className={cn(
              interactive &&
                "relative select-none before:absolute before:-inset-x-1 before:inset-y-0 before:rounded before:bg-muted before:opacity-0 before:content-[''] hover:cursor-copy hover:before:opacity-60 active:before:opacity-100",
            )}
            onClick={
              interactive
                ? async () => {
                    try {
                      await navigator.clipboard.writeText(relative);
                      toast.success("Copied relative time to clipboard");
                    } catch (e) {
                      toast.error("Failed to copy relative time to clipboard");
                      console.error("Failed to copy relative time", e);
                    }
                  }
                : undefined
            }
          >
            <td className="relative py-0.5">
              <span
                className={cn(
                  "truncate text-muted-foreground",
                  shortLabels && "rounded bg-muted px-1 font-mono",
                )}
              >
                Relative
              </span>
            </td>
            <td
              className={cn(
                "relative whitespace-nowrap py-0.5 pl-3 text-foreground",
                shortLabels && "pl-2",
              )}
            >
              {relative}
            </td>
          </tr>
        )}
      </table>
    </div>
  );
}

export default TimestampTooltip;
