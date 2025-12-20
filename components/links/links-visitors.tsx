import Link from "next/link";

import { AlertTriangleIcon } from "lucide-react";

import { usePlan } from "@/lib/swr/use-billing";
import { useLinkVisits } from "@/lib/swr/use-link";
import { durationFormat, timeAgo } from "@/lib/utils";

import { Gauge } from "@/components/ui/gauge";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import { VisitorAvatar } from "@/components/visitors/visitor-avatar";

export default function LinksVisitors({
  linkId,
  linkName,
}: {
  linkId: string;
  linkName: string;
}) {
  const { views, hiddenFromPause } = useLinkVisits(linkId);
  const { isPaused } = usePlan();

  return (
    <>
      {views && isPaused && hiddenFromPause > 0 && (
        <TableRow>
          <TableCell colSpan={5} className="text-left sm:text-center">
            <div className="flex flex-col items-start justify-center gap-2 sm:flex-row sm:items-center">
              <span className="flex items-center gap-x-1">
                <AlertTriangleIcon className="inline-block h-4 w-4 text-orange-500" />
                {hiddenFromPause} visit
                {hiddenFromPause !== 1 ? "s" : ""} occurred while your
                subscription was paused and{" "}
                {hiddenFromPause !== 1 ? "are" : "is"} hidden.
              </span>
              <Link
                href="/settings/billing"
                className="font-medium text-orange-600 underline hover:text-orange-700"
              >
                Unpause subscription to see all visits
              </Link>
            </div>
          </TableCell>
        </TableRow>
      )}
      {views ? (
        views.map((view) => (
          <TableRow key={view.id}>
            <TableCell colSpan={2}>
              <div className="flex items-center overflow-visible sm:space-x-3">
                <VisitorAvatar
                  viewerEmail={view.viewerEmail}
                  className="h-7 w-7 text-xs md:h-8 md:w-8 md:text-sm"
                />

                <p className="overflow-visible text-sm text-gray-800 dark:text-gray-200">
                  {view.viewerEmail ? view.viewerEmail : "Anonymous"}
                </p>
              </div>
            </TableCell>

            <TableCell>
              <div className="flex items-center space-x-2 md:space-x-4">
                <div className="whitespace-nowrap text-sm text-muted-foreground">
                  {durationFormat(view.totalDuration)}
                </div>

                <div className="text-xs md:text-sm">
                  <Gauge
                    value={view.completionRate}
                    size={"small"}
                    showValue={true}
                  />
                </div>
              </div>
            </TableCell>

            <TableCell>
              <div>
                <time
                  className="truncate text-sm text-muted-foreground"
                  dateTime={new Date(view.viewedAt).toISOString()}
                >
                  {timeAgo(view.viewedAt)}
                </time>
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell"></TableCell>
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={2}>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-6 w-[220px]" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-16" />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
