import Link from "next/link";
import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
  AlertTriangleIcon,
  BadgeCheckIcon,
  BadgeInfoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
  Download,
  DownloadCloudIcon,
  FileBadgeIcon,
  ServerIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

import { usePlan } from "@/lib/swr/use-billing";
import { cn, durationFormat, fetcher, timeAgo } from "@/lib/utils";
import { downloadCSV } from "@/lib/utils/csv";

import { Button } from "@/components/ui/button";
import { Gauge } from "@/components/ui/gauge";
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
import { DataTablePagination } from "@/components/visitors/data-table-pagination";
import { VisitorAvatar } from "@/components/visitors/visitor-avatar";

import { UpgradeButton } from "../ui/upgrade-button";

interface View {
  id: string;
  viewerEmail: string | null;
  documentName: string;
  linkName: string;
  viewedAt: Date;
  totalDuration: number;
  completionRate: number;
  verified?: boolean;
  internal?: boolean;
  agreementResponse?: any;
  downloadedAt?: Date;
  dataroomId?: string;
  feedbackResponse?: any;
  versionNumber?: number;
  versionNumPages?: number;
  documentId?: string;
  teamId?: string;
}

const columns: ColumnDef<View>[] = [
  {
    accessorKey: "viewerEmail",
    header: "Recent Views",
    cell: ({ row }) => (
      <div className="flex items-center overflow-visible sm:space-x-3">
        <VisitorAvatar viewerEmail={row.original.viewerEmail} />
        <div className="min-w-0 flex-1">
          <div className="focus:outline-none">
            <p className="flex items-center gap-x-2 overflow-visible text-sm font-medium text-gray-800 dark:text-gray-200">
              {row.original.viewerEmail ? (
                <>
                  {row.original.viewerEmail}{" "}
                  {row.original.verified && (
                    <BadgeTooltip content="Verified visitor" key="verified">
                      <BadgeCheckIcon className="h-4 w-4 text-emerald-500 hover:text-emerald-600" />
                    </BadgeTooltip>
                  )}
                  {row.original.internal && (
                    <BadgeTooltip content="Internal visitor" key="internal">
                      <BadgeInfoIcon className="h-4 w-4 text-blue-500 hover:text-blue-600" />
                    </BadgeTooltip>
                  )}
                  {row.original.agreementResponse && (
                    <BadgeTooltip
                      content={`Agreed to ${row.original.agreementResponse.agreement.name}`}
                      key="agreement"
                    >
                      <FileBadgeIcon className="h-4 w-4 text-emerald-500 hover:text-emerald-600" />
                    </BadgeTooltip>
                  )}
                  {row.original.downloadedAt && (
                    <BadgeTooltip
                      content={`Downloaded ${timeAgo(row.original.downloadedAt)}`}
                      key="download"
                    >
                      <DownloadCloudIcon className="h-4 w-4 text-cyan-500 hover:text-cyan-600" />
                    </BadgeTooltip>
                  )}
                  {row.original.dataroomId && (
                    <BadgeTooltip content={`Dataroom Visitor`} key="download">
                      <ServerIcon className="h-4 w-4 text-[#fb7a00] hover:text-[#fb7a00]/90" />
                    </BadgeTooltip>
                  )}
                  {row.original.feedbackResponse && (
                    <BadgeTooltip
                      content={`${row.original.feedbackResponse.data.question}: ${row.original.feedbackResponse.data.answer}`}
                      key="feedback"
                    >
                      {row.original.feedbackResponse.data.answer === "yes" ? (
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
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "documentName",
    header: "Document",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.documentId ? (
          <Link
            href={`/documents/${row.original.documentId}`}
            className="flex items-center gap-x-2 overflow-visible text-sm text-gray-800 hover:text-gray-600 dark:text-gray-200 dark:hover:text-gray-400"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.documentName}
          </Link>
        ) : (
          <span className="text-muted-foreground">
            {row.original.documentName}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "linkName",
    header: "Link",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.linkName}
      </div>
    ),
  },
  {
    accessorKey: "totalDuration",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className={cn(
            column.getIsSorted()
              ? "text-nowrap font-medium"
              : "text-nowrap font-normal",
            "px-0",
          )}
        >
          Time Spent
          {column.getIsSorted() === "asc" ? (
            <ChevronUpIcon className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          ) : (
            <ChevronsUpDownIcon className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {durationFormat(row.original.totalDuration)}
      </div>
    ),
  },
  {
    accessorKey: "completionRate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className={cn(
            column.getIsSorted()
              ? "text-nowrap font-medium"
              : "text-nowrap font-normal",
            "px-0",
          )}
        >
          Completion
          {column.getIsSorted() === "asc" ? (
            <ChevronUpIcon className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          ) : (
            <ChevronsUpDownIcon className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="flex justify-start text-sm text-muted-foreground">
        <Gauge
          value={row.original.completionRate}
          size={"small"}
          showValue={true}
        />
      </div>
    ),
  },
  {
    accessorKey: "viewedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className={cn(
            column.getIsSorted()
              ? "text-nowrap font-medium"
              : "text-nowrap font-normal",
            "px-0",
          )}
        >
          Last Viewed
          {column.getIsSorted() === "asc" ? (
            <ChevronUpIcon className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          ) : (
            <ChevronsUpDownIcon className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <TimestampTooltip
        timestamp={row.original.viewedAt}
        side="right"
        rows={["local", "utc", "unix"]}
      >
        <div className="select-none text-sm text-muted-foreground">
          {timeAgo(row.original.viewedAt)}
        </div>
      </TimestampTooltip>
    ),
  },
];

export default function ViewsTable({
  startDate,
  endDate,
}: {
  startDate: Date;
  endDate: Date;
}) {
  const router = useRouter();
  const teamInfo = useTeam();
  const { isTrial, isFree, isPaused } = usePlan();
  const { interval = "7d" } = router.query;
  const [sorting, setSorting] = useState<SortingState>([
    { id: "viewedAt", desc: true },
  ]);

  const { data } = useSWR<{ views: View[]; hiddenFromPause: number }>(
    teamInfo?.currentTeam?.id
      ? `/api/analytics?type=views&interval=${interval}&teamId=${teamInfo.currentTeam.id}${interval === "custom" ? `&startDate=${format(startDate, "MM-dd-yyyy")}&endDate=${format(endDate, "MM-dd-yyyy")}` : ""}`
      : null,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  const views = data?.views;
  const hiddenFromPause = data?.hiddenFromPause ?? 0;

  const table = useReactTable({
    data: views || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  const handleExport = () => {
    if (isFree && !isTrial) {
      toast.error("Please upgrade to export data");
      return;
    }

    if (!views?.length) {
      toast.error("No data to export");
      return;
    }

    const exportData = views.map((view) => ({
      "Visitor Email": view.viewerEmail || "Anonymous",
      Document: view.documentName,
      Link: view.linkName,
      "Time Spent": durationFormat(view.totalDuration),
      "Completion Rate": `${view.completionRate}%`,
      "Viewed At": new Date(view.viewedAt).toISOString(),
      Verified: view.verified ? "Yes" : "No",
    }));

    downloadCSV(exportData, "views");
  };

  const UpgradeOrExportButton = () => {
    if (isFree && !isTrial) {
      return (
        <UpgradeButton
          text="Export"
          clickedPlan={PlanEnum.Pro}
          trigger="dashboard_views_export"
          variant="outline"
          size="sm"
        />
      );
    } else {
      return (
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="!size-4" />
          Export
        </Button>
      );
    }
  };

  return (
    <div className="space-y-4">
      {isPaused && hiddenFromPause > 0 && (
        <div className="flex flex-col items-start justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950 sm:flex-row sm:items-center">
          <span className="flex items-center gap-x-1 text-sm">
            <AlertTriangleIcon className="inline-block h-4 w-4 text-orange-500" />
            {hiddenFromPause} view{hiddenFromPause !== 1 ? "s" : ""} occurred
            after your team was paused and{" "}
            {hiddenFromPause !== 1 ? "are" : "is"} hidden.{" "}
          </span>
          <Link
            href="/settings/billing"
            className="text-sm font-medium text-orange-600 underline hover:text-orange-700"
          >
            Unpause subscription to see all views
          </Link>
        </div>
      )}
      <div className="flex justify-end">
        <UpgradeOrExportButton />
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-4">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                // <Collapsible key={row.id} asChild>
                <>
                  {/* <CollapsibleTrigger asChild> */}
                  <TableRow>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {/* </CollapsibleTrigger> */}
                  {/* <CollapsibleContent asChild>
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={columns.length}>
                          <div className="pb-0.5 pl-0.5 md:pb-1 md:pl-1">
                            <div className="flex items-center gap-x-1 px-1">
                              <FileDigitIcon className="size-4" /> Document
                              Version {row.original.versionNumber}
                            </div>
                          </div>
                          <VisitorChart
                            documentId={row.original.documentId!}
                            viewId={row.original.id}
                            totalPages={row.original.versionNumPages}
                            versionNumber={row.original.versionNumber}
                          />
                          <VisitorClicks
                            teamId={row.original.teamId!}
                            documentId={row.original.documentId!}
                            viewId={row.original.id}
                          />
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent> */}
                </>
                // </Collapsible>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <p>No views in the last {interval}</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} name="view" />
    </div>
  );
}
