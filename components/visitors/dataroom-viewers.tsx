import { useState } from "react";

import {
  BadgeCheckIcon,
  BadgeInfoIcon,
  DownloadCloudIcon,
  MailOpenIcon,
  SendIcon,
} from "lucide-react";

import { useDataroomViewers } from "@/lib/swr/use-dataroom";
import { timeAgo } from "@/lib/utils";

import ChevronDown from "@/components/shared/icons/chevron-down";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TimestampTooltip } from "@/components/ui/timestamp-tooltip";
import { BadgeTooltip } from "@/components/ui/tooltip";

import { DataroomViewStats } from "./dataroom-view-stats";
import { VisitorAvatar } from "./visitor-avatar";

export default function DataroomViewersTable({
  dataroomId,
}: {
  dataroomId: string;
}) {
  const { viewers } = useDataroomViewers({ dataroomId });
  const [expandedViewerIds, setExpandedViewerIds] = useState<Set<string>>(
    new Set(),
  );

  const handleOpenChange = (viewerId: string, open: boolean) => {
    setExpandedViewerIds((prev) => {
      const next = new Set(prev);
      if (open) {
        next.add(viewerId);
      } else {
        next.delete(viewerId);
      }
      return next;
    });
  };

  return (
    <div className="w-full">
      <div>
        <h2 className="mb-2 md:mb-4">All dataroom visitors</h2>
      </div>
      <div className="rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="*:whitespace-nowrap *:font-medium hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead className="w-[120px]">
                {expandedViewerIds.size > 0 ? "View Duration" : null}
              </TableHead>
              <TableHead className="w-[140px]">
                {expandedViewerIds.size > 0 ? "View Completion" : null}
              </TableHead>
              <TableHead className="w-[120px]">Last Viewed</TableHead>
              <TableHead className="w-[48px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {viewers?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex h-40 w-full items-center justify-center">
                    <p>No Data Available</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {viewers ? (
              viewers.map((viewer) => (
                <Collapsible
                  key={viewer.id}
                  asChild
                  onOpenChange={(open) => handleOpenChange(viewer.id, open)}
                >
                  <>
                    <TableRow key={viewer.id} className="group/row">
                      {/* Name */}
                      <TableCell className="">
                        <div className="flex items-center overflow-visible sm:space-x-3">
                          <VisitorAvatar viewerEmail={viewer.email} />
                          <div className="min-w-0 flex-1">
                            <div className="focus:outline-none">
                              <p className="flex items-center gap-x-2 overflow-visible text-sm font-medium text-gray-800 dark:text-gray-200">
                                {viewer.email ? (
                                  <>
                                    {(viewer as any).viewerName || viewer.email}{" "}
                                    {viewer.verified && (
                                      <BadgeTooltip
                                        content="Verified visitor"
                                        key={`verified-${viewer.id}`}
                                      >
                                        <BadgeCheckIcon className="h-4 w-4 text-emerald-500 hover:text-emerald-600" />
                                      </BadgeTooltip>
                                    )}
                                    {viewer.internal && (
                                      <BadgeTooltip
                                        content="Internal visitor"
                                        key={`internal-${viewer.id}`}
                                      >
                                        <BadgeInfoIcon className="h-4 w-4 text-blue-500 hover:text-blue-600" />
                                      </BadgeTooltip>
                                    )}
                                    {viewer.invitedAt && (
                                      <BadgeTooltip
                                        content={`Invited ${timeAgo(viewer.invitedAt)}`}
                                        key={`invited-${viewer.id}`}
                                      >
                                        <SendIcon className="h-4 w-4 text-sky-500 hover:text-sky-600" />
                                      </BadgeTooltip>
                                    )}
                                  </>
                                ) : (
                                  "Anonymous"
                                )}
                              </p>
                              {(viewer as any).viewerName && viewer.email && (
                                <p className="text-xs text-muted-foreground/60">
                                  {viewer.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell />
                      <TableCell />
                      {/* Last Viewed */}
                      <TableCell className="text-sm text-muted-foreground">
                        {viewer.lastViewedAt ? (
                          <TimestampTooltip
                            timestamp={viewer.lastViewedAt}
                            side="right"
                            rows={["local", "utc", "unix"]}
                          >
                            <time
                              className="select-none"
                              dateTime={new Date(
                                viewer.lastViewedAt,
                              ).toISOString()}
                            >
                              {timeAgo(viewer.lastViewedAt)}
                            </time>
                          </TimestampTooltip>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      {/* Actions */}
                      <TableCell className="cursor-pointer p-0 text-center sm:text-right">
                        {viewer.views.length > 0 ? (
                          <CollapsibleTrigger asChild>
                            <div className="flex justify-end space-x-1 p-5 [&[data-state=open]>svg.chevron]:rotate-180">
                              <ChevronDown className="chevron h-4 w-4 shrink-0 transition-transform duration-200" />
                            </div>
                          </CollapsibleTrigger>
                        ) : null}
                      </TableCell>
                    </TableRow>

                    {viewer.views.length > 0
                      ? viewer.views.map((view: any) => (
                          <CollapsibleContent asChild key={view.id}>
                            <>
                              <TableRow key={view.id} className="[&>td]:py-3">
                                <TableCell>
                                  <div className="flex items-center gap-x-4 overflow-visible">
                                    <MailOpenIcon className="h-5 w-5 text-[#fb7a00]" />
                                    Accessed {viewer.dataroomName} dataroom
                                  </div>
                                </TableCell>
                                <TableCell />
                                <TableCell />
                                <TableCell>
                                  <TimestampTooltip
                                    timestamp={view.viewedAt}
                                    side="right"
                                    rows={["local", "utc", "unix"]}
                                  >
                                    <time
                                      className="select-none truncate text-sm text-muted-foreground"
                                      dateTime={new Date(
                                        view.viewedAt,
                                      ).toISOString()}
                                    >
                                      {timeAgo(view.viewedAt)}
                                    </time>
                                  </TimestampTooltip>
                                </TableCell>
                                <TableCell />
                              </TableRow>

                              {view.downloadedAt ? (
                                <TableRow
                                  key={`download-${view.id}`}
                                  className="[&>td]:py-3"
                                >
                                  <TableCell>
                                    <div className="flex items-center gap-x-4 overflow-visible">
                                      <DownloadCloudIcon className="h-5 w-5 text-cyan-500 hover:text-cyan-600" />
                                      Downloaded {viewer.dataroomName} dataroom
                                    </div>
                                  </TableCell>
                                  <TableCell />
                                  <TableCell />
                                  <TableCell>
                                    <TimestampTooltip
                                      timestamp={view.downloadedAt}
                                      side="right"
                                      rows={["local", "utc", "unix"]}
                                    >
                                      <time
                                        className="select-none truncate text-sm text-muted-foreground"
                                        dateTime={new Date(
                                          view.downloadedAt,
                                        ).toISOString()}
                                      >
                                        {timeAgo(view.downloadedAt)}
                                      </time>
                                    </TimestampTooltip>
                                  </TableCell>
                                  <TableCell />
                                </TableRow>
                              ) : null}

                              <DataroomViewStats
                                viewId={view.id}
                                dataroomId={dataroomId}
                                isExpanded={expandedViewerIds.has(viewer.id)}
                              />
                            </>
                          </CollapsibleContent>
                        ))
                      : null}
                  </>
                </Collapsible>
              ))
            ) : (
              <TableRow>
                <TableCell className="min-w-[100px]">
                  <Skeleton className="h-6 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-14" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-6 rounded-full" />
                </TableCell>
                <TableCell className="min-w-[100px]">
                  <Skeleton className="h-6 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-6" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
