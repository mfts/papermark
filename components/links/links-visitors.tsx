import { durationFormat, timeAgo } from "@/lib/utils";
import { TableCell, TableRow } from "@/components/ui/table";
import { useLinkVisits } from "@/lib/swr/use-link";
import { Gauge } from "@/components/ui/gauge";
import { VisitorAvatar } from "@/components/visitors/visitor-avatar";
import LinksVisitorsSkeleton from "../skeletons/links-visitors-skeleton";

export default function LinksVisitors({
  linkId,
  linkName,
}: {
  linkId: string;
  linkName: string;
}) {
  const { views } = useLinkVisits(linkId);

  return (
    <>
      {views ? (
        views.map((view) => (
          <TableRow key={view.id}>
            <TableCell colSpan={2}>
              <div className="flex items-center sm:space-x-3 overflow-visible">
                <VisitorAvatar
                  viewerEmail={view.viewerEmail}
                  className="w-7 md:w-8 h-7 md:h-8 text-xs md:text-sm"
                />

                <p className="text-sm text-gray-800 dark:text-gray-200 overflow-visible">
                  {view.viewerEmail ? view.viewerEmail : "Anonymous"}
                </p>
              </div>
            </TableCell>

            <TableCell>
              <div className="flex space-x-2 md:space-x-4 items-center">
                <div className="text-sm text-muted-foreground whitespace-nowrap">
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
        <LinksVisitorsSkeleton />
      )}
    </>
  );
}
