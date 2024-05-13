import Link from "next/link";

import { FileCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

import { useDataroomVisitHistory } from "@/lib/swr/use-dataroom";
import { timeAgo } from "@/lib/utils";

export default function DataroomVisitHistory({
  viewId,
  dataroomId,
}: {
  viewId: string;
  dataroomId: string;
}) {
  const { documentViews } = useDataroomVisitHistory({ viewId, dataroomId });

  return (
    <>
      {documentViews ? (
        documentViews.map((view) => (
          <TableRow key={view.id}>
            <TableCell>
              <div className="flex items-center gap-x-4 overflow-visible">
                <FileCheckIcon className="h-5 w-5 text-[#fb7a00]" />
                Viewed {view.document.name}
              </div>
            </TableCell>

            <TableCell>
              <div>
                <time
                  className="truncate text-sm text-muted-foreground"
                  dateTime={new Date(view.viewedAt).toISOString()}
                  title={new Date(view.viewedAt).toLocaleString()}
                >
                  {timeAgo(view.viewedAt)}
                </time>
              </div>
            </TableCell>
            <TableCell className="table-cell">
              <div className="flex items-center justify-end space-x-4">
                <Button size={"sm"} variant={"link"} className="">
                  <Link href={`/documents/${view.document.id}`}>
                    See document
                  </Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))
      ) : (
        <TableRow>
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
