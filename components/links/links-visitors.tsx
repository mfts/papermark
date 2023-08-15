import { durationFormat, timeAgo } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TableCell, TableRow } from "@/components/ui/table";
import { useLinkVisits } from "@/lib/swr/use-link";
import { Gauge } from "@/components/ui/gauge";



export default function LinksVisitors({linkId, linkName}: {linkId: string, linkName: string}) {
  const { views } = useLinkVisits(linkId);
  
  return (
    // <div className="w-full overflow-auto">
    <>
      {views
        ? views.map((view) => (
            <TableRow key={view.id} className="">
              <TableCell className="flex items-center space-x-3">
                <Avatar className="flex-shrink-0">
                  <AvatarFallback>
                    {view.viewerEmail?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="focus:outline-none">
                    {/* <span className="absolute inset-0" aria-hidden="true" /> */}
                    <p className="text-sm font-medium text-gray-200">
                      {view.viewerEmail}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span>{linkName}</span>
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-400 text-right">
                {durationFormat(view.totalDuration)}
              </TableCell>
              <TableCell className="text-sm text-gray-400">
                <Gauge
                  value={view.completionRate}
                  size={"small"}
                  showValue={true}
                />
              </TableCell>
              <TableCell>
                <time
                  className="truncate text-sm text-gray-400"
                  dateTime={new Date(view.viewedAt).toISOString()}
                >
                  {timeAgo(view.viewedAt)}
                </time>
              </TableCell>
            </TableRow>
          ))
        : null}
    </>
    // </div>
  );
}