import { useState } from "react";

import { useLinkVisits } from "@/lib/swr/use-link";
import { durationFormat, timeAgo } from "@/lib/utils";

import { Pagination } from "@/components/documents/pagination";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { views, pagination, loading } = useLinkVisits(
    linkId,
    currentPage,
    pageSize,
  );

  return (
    <>
      {views ? (
        <>
          {views.map((view) => (
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
              <TableCell></TableCell>
              <TableCell></TableCell>
            </TableRow>
          ))}
          {pagination && pagination.total > 0 && (
            <TableRow>
              <TableCell colSpan={6}>
                <Pagination
                  className="mt-0 border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-950"
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalItems={pagination.total}
                  totalPages={pagination.pages}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size: number) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  totalShownItems={views.length}
                  itemName="visits"
                />
              </TableCell>
            </TableRow>
          )}
        </>
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
          <TableCell></TableCell>
          <TableCell></TableCell>
        </TableRow>
      )}
    </>
  );
}
