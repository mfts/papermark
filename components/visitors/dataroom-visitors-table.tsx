import { useTeam } from "@/context/team-context";
import {
  BadgeCheckIcon,
  BadgeInfoIcon,
  DownloadCloudIcon,
  FileBadgeIcon,
  MailOpenIcon,
} from "lucide-react";
import { toast } from "sonner";

import ChevronDown from "@/components/shared/icons/chevron-down";
import { Button } from "@/components/ui/button";
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
import { BadgeTooltip } from "@/components/ui/tooltip";

import { useDataroomVisits } from "@/lib/swr/use-dataroom";
import { timeAgo } from "@/lib/utils";

import DataroomVisitorCustomFields from "./dataroom-visitor-custom-fields";
import { DataroomVisitorUserAgent } from "./dataroom-visitor-useragent";
import DataroomVisitHistory from "./dataroom-visitors-history";
import { VisitorAvatar } from "./visitor-avatar";

export default function DataroomVisitorsTable({
  dataroomId,
}: {
  dataroomId: string;
}) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const { views } = useDataroomVisits({ dataroomId });

  const exportVisitCounts = async (dataroomId: string) => {
    const formattedTime = new Date().toISOString().replace(/[-:Z]/g, "");
    try {
      const response = await fetch(
        `/api/teams/${teamId}/datarooms/${dataroomId}/export-visits`,
        { method: "GET" },
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Create blob and download
      const blob = new Blob([data.visits], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${data.dataroomName}_visits_${formattedTime}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("CSV file downloaded successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        "An error occurred while downloading the CSV. Please try again.",
      );
    }
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between md:mb-4">
        <h2>All visitors</h2>
        <Button size="sm" onClick={() => exportVisitCounts(dataroomId)}>
          Export visits
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="*:whitespace-nowrap *:font-medium hover:bg-transparent">
              <TableHead>Name</TableHead>
              {/* <TableHead>Visit Duration</TableHead> */}
              {/* <TableHead>Last Viewed Document</TableHead> */}
              <TableHead>Last Viewed</TableHead>
              <TableHead className="text-center sm:text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {views?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex h-40 w-full items-center justify-center">
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
                                    {view.downloadedAt && (
                                      <BadgeTooltip
                                        content={`Downloaded ${timeAgo(view.downloadedAt)}`}
                                        key="download"
                                      >
                                        <DownloadCloudIcon className="h-4 w-4 text-cyan-500 hover:text-cyan-600" />
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
                      {/* <TableCell className="">
                        <div className="text-sm text-muted-foreground">
                          {durationFormat(view.totalDuration)}
                        </div>
                      </TableCell> */}
                      {/* Completion */}
                      {/* <TableCell className="flex justify-start">
                        <div className="text-sm text-muted-foreground">
                          <Gauge
                            value={view.completionRate}
                            size={"small"}
                            showValue={true}
                          />
                        </div>
                      </TableCell> */}
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
                        <TableRow>
                          <TableCell colSpan={3}>
                            <DataroomVisitorCustomFields
                              viewId={view.id}
                              teamId={view.teamId!}
                              dataroomId={dataroomId}
                            />
                            <DataroomVisitorUserAgent viewId={view.id} />
                          </TableCell>
                        </TableRow>
                        <TableRow key={view.id}>
                          <TableCell>
                            <div className="flex items-center gap-x-4 overflow-visible">
                              <MailOpenIcon className="h-5 w-5 text-[#fb7a00]" />
                              Accessed {view.dataroomName} dataroom
                            </div>
                          </TableCell>

                          <TableCell>
                            <div>
                              <time
                                className="truncate text-sm text-muted-foreground"
                                dateTime={new Date(
                                  view.viewedAt,
                                ).toLocaleString()}
                                title={new Date(view.viewedAt).toLocaleString()}
                              >
                                {timeAgo(view.viewedAt)}
                              </time>
                            </div>
                          </TableCell>
                          <TableCell className="table-cell"></TableCell>
                        </TableRow>

                        {view.downloadedAt ? (
                          <TableRow key={view.id + 1}>
                            <TableCell>
                              <div className="flex items-center gap-x-4 overflow-visible">
                                <DownloadCloudIcon className="h-5 w-5 text-cyan-500 hover:text-cyan-600" />
                                Downloaded {view.dataroomName} dataroom
                              </div>
                            </TableCell>

                            <TableCell>
                              <div>
                                <time
                                  className="truncate text-sm text-muted-foreground"
                                  dateTime={new Date(
                                    view.downloadedAt,
                                  ).toLocaleString()}
                                  title={new Date(
                                    view.downloadedAt,
                                  ).toLocaleString()}
                                >
                                  {timeAgo(view.downloadedAt)}
                                </time>
                              </div>
                            </TableCell>
                            <TableCell className="table-cell"></TableCell>
                          </TableRow>
                        ) : null}

                        <DataroomVisitHistory
                          viewId={view.id}
                          dataroomId={dataroomId}
                        />
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
