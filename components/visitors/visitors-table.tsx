import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Gauge } from "@/components/ui/gauge";

import { useDocumentVisits } from "@/lib/swr/use-document";
import { durationFormat, timeAgo } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import ChevronDown from "../shared/icons/chevron-down";
import VisitorChart from "./visitor-chart";

export default function VisitorsTable({ numPages }: { numPages: number }) {
  const { views } = useDocumentVisits();

  return (
    <div className="w-full sm:p-4">
      <div>
        <h2 className="p-4">All visitors</h2>
      </div>
      <div className="rounded-md sm:border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-medium">Name</TableHead>
              <TableHead className="font-medium">Visit Duration</TableHead>
              <TableHead className="font-medium">Visit Completion</TableHead>
              <TableHead className="font-medium">Last Viewed</TableHead>
              <TableHead className="font-medium text-center sm:text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {views ? (
              views.map((view) => (
                <Collapsible key={view.id} asChild>
                  <>
                    <TableRow key={view.id} className="group/row">
                      {/* Name */}
                      <TableCell className="">
                        <div className="flex items-center sm:space-x-3 overflow-visible">
                          <Avatar className="flex-shrink-0 hidden sm:inline-flex">
                            <AvatarFallback>
                              {view.viewerEmail?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="focus:outline-none">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 overflow-visible">
                                {view.viewerEmail
                                  ? view.viewerEmail
                                  : "Anonymous"}
                              </p>
                              <p className="text-sm text-muted-foreground/60">
                                {view.link.name ? view.link.name : view.linkId}
                              </p>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      {/* Duration */}
                      <TableCell className="">
                        <div className="text-sm text-muted-foreground">
                          {durationFormat(view.totalDuration)}
                        </div>
                      </TableCell>
                      {/* Completion */}
                      <TableCell className="flex justify-start">
                        <div className="text-sm text-muted-foreground">
                          <Gauge
                            value={view.completionRate}
                            size={"small"}
                            showValue={true}
                          />
                        </div>
                      </TableCell>
                      {/* Last Viewed */}
                      <TableCell className="text-sm text-muted-foreground">
                        <time dateTime={new Date(view.viewedAt).toISOString()}>
                          {timeAgo(view.viewedAt)}
                        </time>
                      </TableCell>
                      {/* Actions */}
                      <TableCell className="text-center sm:text-right">
                        <CollapsibleTrigger asChild>
                          <div className="flex justify-end px-2 space-x-1 [&[data-state=open]>svg.chevron]:rotate-180">
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 chevron" />
                          </div>
                        </CollapsibleTrigger>
                      </TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                      <>
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={5}>
                            <div>
                              <VisitorChart
                                documentId={view.documentId}
                                viewId={view.id}
                                totalPages={numPages}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      </>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))
            ) : (
              <TableRow>
                <TableCell className="min-w-[100px]">
                  <Skeleton className="h-6 w-full" />
                </TableCell>
                <TableCell className="min-w-[450px]">
                  <Skeleton className="h-6 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-24" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
