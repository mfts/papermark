import { LinkType } from "@prisma/client";

import { Gauge } from "@/components/ui/gauge";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import { VisitorAvatar } from "@/components/visitors/visitor-avatar";

import { useLinkVisits, ViewWithDuration } from "@/lib/swr/use-link";
import { durationFormat, timeAgo } from "@/lib/utils";
import { FileIcon } from "lucide-react";
import { useRouter } from "next/navigation";
export default function LinksVisitors({
  linkId,
  linkName,
  linkType,
}: {
  linkId: string;
  linkName: string;
    linkType?: LinkType
}) {
  const router = useRouter();
  const { views } = useLinkVisits(linkId, linkType);

  const handleViewClick = (view: ViewWithDuration) => {
    if (view.uploadDocumentIds && view.uploadDocumentIds?.length !== 0) {
      router.push(
        view.uploadFolder?.path
          ? `/documents/tree/${view.uploadFolder.path}`
          : view?.uploadDataroomFolder?.dataroom.id
            ? `/datarooms/${view.uploadDataroomFolder.dataroom.id}/documents/${view.uploadDataroomFolder.path}`
            : `/inbox`
      )
    }
  };

  return (
    <>
      {views ? (
        views.map((view) => (
          <TableRow key={view.id} onClick={() => handleViewClick(view)}>
            <TableCell colSpan={2}>
              <div className="flex items-center overflow-visible sm:space-x-3">
                <VisitorAvatar
                  viewerEmail={view.viewerEmail}
                  className="h-7 w-7 text-xs md:h-8 md:w-8 md:text-sm"
                />

                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {view.viewerEmail || "Anonymous"}
                    </p>
                    {view.uploadDocumentIds && view.uploadDocumentIds?.length !== 0 ? (
                      <div className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 cursor-pointer">
                        <FileIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          {view.uploadDocumentIds?.length || 0} file{view.uploadDocumentIds?.length === 1 ? "" : "s"} uploaded
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </TableCell>

            <TableCell>
              <div className="flex items-center space-x-2 md:space-x-4">
                {view.totalDuration ? (
                  <div className="whitespace-nowrap text-sm text-muted-foreground">
                    {durationFormat(view.totalDuration)}
                  </div>
                ) : null}

                {view.totalDuration ? (
                  <div className="text-xs md:text-sm">
                    <Gauge
                      value={view.completionRate ?? 0}
                      size={"small"}
                      showValue={true}
                    />
                  </div>
                ) : null}
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
