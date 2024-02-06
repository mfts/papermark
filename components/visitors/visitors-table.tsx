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
import { Gauge } from "@/components/ui/gauge";

import { useDocumentVisits } from "@/lib/swr/use-document";
import { durationFormat, timeAgo } from "@/lib/utils";
import ChevronDown from "@/components/shared/icons/chevron-down";
import VisitorChart from "./visitor-chart";
import { VisitorAvatar } from "./visitor-avatar";
import BadgeCheck from "../shared/icons/badge-check";
import VisitorsTableSkeleton from "../skeletons/visitors-table-skeleton";

export default function VisitorsTable({ numPages }: { numPages: number }) {
  const { views } = useDocumentVisits();

  return (
    <div className="w-full">
      <div>
        <h2 className="mb-2 md:mb-4">All visitors</h2>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent *:font-medium *:whitespace-nowrap">
              <TableHead>Name</TableHead>
              <TableHead>Visit Duration</TableHead>
              <TableHead>Visit Completion</TableHead>
              <TableHead>Last Viewed</TableHead>
              <TableHead className="text-center sm:text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {views?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="w-full h-40 flex items-center justify-center">
                    <p>No Data Available</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {views ? (
              views.map((view) => (
                <Collapsible key={view.id} asChild>
                  <>
                    <TableRow key={view.id} className="group/row">
                      {/* Name */}
                      <TableCell className="">
                        <div className="flex items-center sm:space-x-3 overflow-visible">
                          <VisitorAvatar viewerEmail={view.viewerEmail} />
                          <div className="min-w-0 flex-1">
                            <div className="focus:outline-none">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 overflow-visible flex items-center gap-x-2">
                                {view.viewerEmail ? (
                                  <>
                                    {view.viewerEmail}{" "}
                                    {view.verified && (
                                      <BadgeCheck className="h-4 w-4 text-emerald-500" />
                                    )}
                                  </>
                                ) : (
                                  "Anonymous"
                                )}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground/60">
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
                      <TableCell className="text-center sm:text-right cursor-pointer p-0">
                        <CollapsibleTrigger asChild>
                          <div className="flex justify-end p-5 space-x-1 [&[data-state=open]>svg.chevron]:rotate-180">
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 chevron" />
                          </div>
                        </CollapsibleTrigger>
                      </TableCell>
                    </TableRow>
                    
                    <CollapsibleContent asChild>
                      <>
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={5}>
                            <VisitorChart
                              documentId={view.documentId}
                              viewId={view.id}
                              totalPages={numPages}
                            />
                          </TableCell>
                        </TableRow>
                      </>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))
            ) : (
              <VisitorsTableSkeleton />
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
