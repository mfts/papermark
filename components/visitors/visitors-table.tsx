import { useState } from "react";

import {
  AlertTriangleIcon,
  BadgeCheckIcon,
  BadgeInfoIcon,
  DownloadCloudIcon,
  FileBadgeIcon,
  ServerIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";

import ChevronDown from "@/components/shared/icons/chevron-down";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Gauge } from "@/components/ui/gauge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeTooltip } from "@/components/ui/tooltip";

import { usePlan } from "@/lib/swr/use-billing";
import { useDocumentVisits } from "@/lib/swr/use-document";
import { durationFormat, timeAgo } from "@/lib/utils";

import { UpgradePlanModal } from "../billing/upgrade-plan-modal";
import { Button } from "../ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { VisitorAvatar } from "./visitor-avatar";
import VisitorChart from "./visitor-chart";

export default function VisitorsTable({ numPages }: { numPages: number }) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const limit = 10; // Set the number of items per page

  const { views, loading, error } = useDocumentVisits(currentPage, limit);
  const { plan } = usePlan();
  const isFreePlan = plan === "free";

  return (
    <div className="w-full">
      <div className="mb-2 md:mb-4">
        <h2>All visitors</h2>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="*:whitespace-nowrap *:font-medium hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Visit Duration</TableHead>
              <TableHead>Visit Completion</TableHead>
              <TableHead>Last Viewed</TableHead>
              <TableHead className="text-center sm:text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {views?.viewsWithDuration.length === 0 &&
              views?.hiddenViewCount === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex h-40 w-full items-center justify-center">
                      <p>No Data Available</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            {views?.viewsWithDuration ? (
              views.viewsWithDuration.map((view) => (
                <Collapsible key={view.id} asChild>
                  <>
                    <TableRow key={view.id} className="group/row">
                      {/* Name */}
                      <TableCell className="">
                        <div className="flex items-center overflow-visible sm:space-x-3">
                          <VisitorAvatar viewerEmail={view.viewerEmail} />
                          <div className="min-w-0 flex-1">
                            <div className="focus:outline-none">
                              <p className="flex items-center gap-x-2 overflow-visible text-sm font-medium text-gray-800 dark:text-gray-200">
                                {view.viewerEmail ? (
                                  <>
                                    {view.viewerEmail}{" "}
                                    {view.verified && (
                                      <BadgeTooltip
                                        content="Verified visitor"
                                        key="verified"
                                      >
                                        <BadgeCheckIcon className="h-4 w-4 text-emerald-500 hover:text-emerald-600" />
                                      </BadgeTooltip>
                                    )}
                                    {view.internal && (
                                      <BadgeTooltip
                                        content="Internal visitor"
                                        key="internal"
                                      >
                                        <BadgeInfoIcon className="h-4 w-4 text-blue-500 hover:text-blue-600" />
                                      </BadgeTooltip>
                                    )}
                                    {view.agreementResponse && (
                                      <BadgeTooltip
                                        content={`Agreed to ${view.agreementResponse.agreement.name}`}
                                        key="nda-agreement"
                                      >
                                        <FileBadgeIcon className="h-4 w-4 text-emerald-500 hover:text-emerald-600" />
                                      </BadgeTooltip>
                                    )}
                                    {view.downloadedAt && (
                                      <BadgeTooltip
                                        content={`Downloaded ${timeAgo(view.downloadedAt)}`}
                                        key="download"
                                      >
                                        <DownloadCloudIcon className="h-4 w-4 text-cyan-500 hover:text-cyan-600" />
                                      </BadgeTooltip>
                                    )}
                                    {view.dataroomId && (
                                      <BadgeTooltip
                                        content={`Dataroom Visitor`}
                                        key="download"
                                      >
                                        <ServerIcon className="h-4 w-4 text-[#fb7a00] hover:text-[#fb7a00]/90" />
                                      </BadgeTooltip>
                                    )}
                                    {view.feedbackResponse && (
                                      <BadgeTooltip
                                        content={`${view.feedbackResponse.data.question}: ${view.feedbackResponse.data.answer}`}
                                        key="feedback"
                                      >
                                        {view.feedbackResponse.data.answer ===
                                        "yes" ? (
                                          <ThumbsUpIcon className="h-4 w-4 text-gray-500 hover:text-gray-600" />
                                        ) : (
                                          <ThumbsDownIcon className="h-4 w-4 text-gray-500 hover:text-gray-600" />
                                        )}
                                      </BadgeTooltip>
                                    )}
                                  </>
                                ) : (
                                  "Anonymous"
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground/60 sm:text-sm">
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
                      <TableCell className="cursor-pointer p-0 text-center sm:text-right">
                        <CollapsibleTrigger asChild>
                          <div className="flex justify-end space-x-1 p-5 [&[data-state=open]>svg.chevron]:rotate-180">
                            <ChevronDown className="chevron h-4 w-4 shrink-0 transition-transform duration-200" />
                          </div>
                        </CollapsibleTrigger>
                      </TableCell>
                    </TableRow>

                    <CollapsibleContent asChild>
                      <>
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={5}>
                            <VisitorChart
                              documentId={view.documentId!}
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
            {views?.hiddenViewCount! > 0 && (
              <>
                <TableRow className="">
                  <TableCell colSpan={5} className="text-left sm:text-center">
                    <div className="flex flex-col items-start justify-center gap-1 sm:flex-row sm:items-center">
                      <span className="flex items-center gap-x-1">
                        <AlertTriangleIcon className="inline-block h-4 w-4 text-yellow-500" />
                        Some older visits may not be shown because your document
                        has more than 20 views.{" "}
                      </span>
                      <UpgradePlanModal clickedPlan="Pro" trigger="">
                        <button className="underline hover:text-gray-800">
                          Upgrade to see full history
                        </button>
                      </UpgradePlanModal>
                    </div>
                  </TableCell>
                </TableRow>
                {Array.from({ length: views?.hiddenViewCount! }).map((_, i) => (
                  <VisitorBlurred key={i} />
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination Controls */}
      <div className="mt-2 flex w-full items-center">
        <div className="w-full text-sm">
          Showing{" "}
          <span className="font-semibold">
            {views?.totalViews && views?.totalViews > 10
              ? 10
              : views?.totalViews}
          </span>{" "}
          of {views?.totalViews} visits
        </div>
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              />
            </PaginationItem>
            {currentPage !== 1 ? (
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(1)}>
                  {1}
                </PaginationLink>
              </PaginationItem>
            ) : null}

            <PaginationItem>
              <PaginationLink isActive>{currentPage}</PaginationLink>
            </PaginationItem>

            {views?.totalViews &&
            currentPage !== Math.ceil(views?.totalViews / 10) ? (
              <PaginationItem>
                <PaginationLink
                  onClick={() =>
                    setCurrentPage(Math.ceil(views?.totalViews / 10))
                  }
                >
                  {Math.ceil(views?.totalViews / 10)}
                </PaginationLink>
              </PaginationItem>
            ) : null}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={
                  views?.totalViews
                    ? currentPage === Math.ceil(views?.totalViews / 10)
                    : true
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

// create a component for a blurred view of the visitor
const VisitorBlurred = () => {
  return (
    <TableRow className="blur-sm">
      <TableCell className="">
        <div className="flex items-center overflow-visible sm:space-x-3">
          <VisitorAvatar viewerEmail={"abc@example.org"} />
          <div className="min-w-0 flex-1">
            <div className="focus:outline-none">
              <p className="flex items-center gap-x-2 overflow-visible text-sm font-medium text-gray-800 dark:text-gray-200">
                Anonymous
              </p>
              <p className="text-xs text-muted-foreground/60 sm:text-sm">
                Demo link
              </p>
            </div>
          </div>
        </div>
      </TableCell>
      {/* Duration */}
      <TableCell className="">
        <div className="text-sm text-muted-foreground">
          {durationFormat(10000)}
        </div>
      </TableCell>
      {/* Completion */}
      <TableCell className="flex justify-start">
        <div className="text-sm text-muted-foreground">
          <Gauge value={90} size={"small"} showValue={true} />
        </div>
      </TableCell>
      {/* Last Viewed */}
      <TableCell className="text-sm text-muted-foreground">
        <time
          dateTime={new Date(
            new Date().getTime() - 30 * 24 * 60 * 60 * 1000,
          ).toISOString()}
        >
          {timeAgo(new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000))}
        </time>
      </TableCell>
      {/* Actions */}
      <TableCell className="cursor-pointer p-0 text-center sm:text-right">
        <div className="flex justify-end space-x-1 p-5 [&[data-state=open]>svg.chevron]:rotate-180">
          <ChevronDown className="chevron h-4 w-4 shrink-0 transition-transform duration-200" />
        </div>
      </TableCell>
    </TableRow>
  );
};
