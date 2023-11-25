import { durationFormat, timeAgo } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TableCell, TableRow } from "@/components/ui/table";
import { useLinkVisits } from "@/lib/swr/use-link";
import { Gauge } from "@/components/ui/gauge";

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
      {views
        ? views.map((view) => (
            <TableRow key={view.id}>
              {/* TableCell for large screens */}
              <TableCell colSpan={3} className="hidden sm:table-cell">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 overflow-visible w-[220px]">
                      <Avatar className="flex-shrink-0 hidden sm:inline-flex">
                        <AvatarFallback>
                          {view.viewerEmail?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="focus:outline-none">
                          <p className="text-sm text-gray-800 dark:text-gray-200 overflow-visible">
                            {view.viewerEmail ? view.viewerEmail : "Anonymous"}
                          </p>
                          {/* <p className="text-sm text-gray-500">
                            <span>{linkName}</span>
                          </p> */}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-4 items-center">
                      <div className="text-sm text-muted-foreground">
                        {durationFormat(view.totalDuration)}
                      </div>

                      <div className="text-sm">
                        <Gauge
                          value={view.completionRate}
                          size={"small"}
                          showValue={true}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TableCell>
              {/* TableCell for small screens */}
              <TableCell colSpan={4} className="table-cell sm:hidden">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center truncate w-[220px]">
                      <Avatar className="flex-shrink-0 hidden sm:inline-flex">
                        <AvatarFallback>
                          {view.viewerEmail?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="focus:outline-none">
                          <p className="text-sm font-medium text-muted-foreground overflow-visible">
                            {view.viewerEmail}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <span>{linkName}</span>
                            <span className="inline-flex">
                              &nbsp;•&nbsp;
                              <time
                                className="truncate text-sm text-muted-foreground"
                                dateTime={new Date(view.viewedAt).toISOString()}
                              >
                                {timeAgo(view.viewedAt)}
                              </time>
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-4 items-center">
                      <div className="text-sm text-muted-foreground">
                        {durationFormat(view.totalDuration)}
                      </div>

                      <div className="text-sm">
                        <Gauge
                          value={view.completionRate}
                          size={"small"}
                          showValue={true}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TableCell>
              {/* TableCell date only on large screens */}
              <TableCell className="hidden sm:table-cell">
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
        : null}
    </>
  );
}
