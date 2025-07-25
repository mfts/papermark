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
  BadgeCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
  Download,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeTooltip } from "@/components/ui/tooltip";
import { DataTablePagination } from "@/components/visitors/data-table-pagination";
import { VisitorAvatar } from "@/components/visitors/visitor-avatar";

import { usePlan } from "@/lib/swr/use-billing";
import { durationFormat, fetcher, timeAgo } from "@/lib/utils";
import { downloadCSV } from "@/lib/utils/csv";
import { UpgradeButton } from "../ui/upgrade-button";

interface Visitor {
  email: string;
  viewerId: string | null;
  totalViews: number;
  lastActive: Date;
  uniqueDocuments: number;
  verified: boolean;
  totalDuration: number;
}

const columns: ColumnDef<Visitor>[] = [
  {
    accessorKey: "email",
    header: "Visitor",
    cell: ({ row }) => (
      <div className="flex items-center overflow-visible sm:space-x-3">
        <VisitorAvatar viewerEmail={row.original.email} />
        <div className="min-w-0 flex-1">
          <div className="focus:outline-none">
            <p className="flex items-center gap-x-2 overflow-visible text-sm font-medium text-gray-800 dark:text-gray-200">
              {row.original.email}{" "}
              {row.original.verified && (
                <BadgeTooltip content="Verified visitor">
                  <BadgeCheckIcon className="h-4 w-4 text-emerald-500 hover:text-emerald-600" />
                </BadgeTooltip>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {row.original.uniqueDocuments} document
              {row.original.uniqueDocuments !== 1 ? "s" : ""} viewed
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "totalViews",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className={
            column.getIsSorted()
              ? "text-nowrap font-medium"
              : "text-nowrap font-normal"
          }
        >
          Total Views
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
        {row.original.totalViews}
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
          className={
            column.getIsSorted()
              ? "text-nowrap font-medium"
              : "text-nowrap font-normal"
          }
        >
          Total Time Spent
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
  // {
  //   accessorKey: "avgCompletionRate",
  //   header: ({ column }) => {
  //     return (
  //       <Button
  //         variant="ghost"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //         className={
  //           column.getIsSorted()
  //             ? "text-nowrap font-medium"
  //             : "text-nowrap font-normal"
  //         }
  //       >
  //         Avg. Completion
  //         {column.getIsSorted() === "asc" ? (
  //           <ChevronUpIcon className="ml-2 h-4 w-4" />
  //         ) : column.getIsSorted() === "desc" ? (
  //           <ChevronDownIcon className="ml-2 h-4 w-4" />
  //         ) : (
  //           <ChevronsUpDownIcon className="ml-2 h-4 w-4" />
  //         )}
  //       </Button>
  //     );
  //   },
  //   cell: ({ row }) => (
  //     <div className="flex justify-start text-sm text-muted-foreground">
  //       <Gauge
  //         value={row.original.avgCompletionRate}
  //         size="small"
  //         showValue={true}
  //       />
  //     </div>
  //   ),
  // },
  {
    accessorKey: "lastActive",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className={
            column.getIsSorted()
              ? "text-nowrap font-medium"
              : "text-nowrap font-normal"
          }
        >
          Last Active
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
        {timeAgo(row.original.lastActive)}
      </div>
    ),
  },
];

export default function VisitorsTable({
  startDate,
  endDate,
}: {
  startDate: Date;
  endDate: Date;
}) {
  const router = useRouter();
  const teamInfo = useTeam();
  const { isTrial, isFree } = usePlan();
  const { interval = "7d" } = router.query;
  const [sorting, setSorting] = useState<SortingState>([
    { id: "lastActive", desc: true },
  ]);

  const { data: visitors } = useSWR<Visitor[]>(
    teamInfo?.currentTeam?.id
      ? `/api/analytics?type=visitors&interval=${interval}&teamId=${teamInfo.currentTeam.id}${interval === "custom" ? `&startDate=${format(startDate, "MM-dd-yyyy")}&endDate=${format(endDate, "MM-dd-yyyy")}` : ""}`
      : null,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  const table = useReactTable({
    data: visitors || [],
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

    if (!visitors?.length) {
      toast.error("No data to export");
      return;
    }

    const exportData = visitors.map((visitor) => ({
      Email: visitor.email,
      "Total Views": visitor.totalViews,
      "Unique Documents": visitor.uniqueDocuments,
      "Total Duration": durationFormat(visitor.totalDuration),
      "Last Active": new Date(visitor.lastActive).toISOString(),
      Verified: visitor.verified ? "Yes" : "No",
    }));

    downloadCSV(exportData, "visitors");
  };

  const UpgradeOrExportButton = () => {
    if (isFree && !isTrial) {
      return (
        <UpgradeButton
          text="Export"
          clickedPlan={PlanEnum.Pro}
          trigger="dashboard_visitors_export"
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
      <div className="flex justify-end">
        <UpgradeOrExportButton />
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-0 first:px-4">
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex w-full flex-col items-center justify-center gap-4 rounded-xl py-4">
                    <div className="hidden rounded-full sm:block">
                      <div className="rounded-full border border-white bg-gradient-to-t from-gray-100 p-1 md:p-3">
                        <UserIcon className="size-6" />
                      </div>
                    </div>
                    <p>No visitors in the last {interval}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} name="visitor" />
    </div>
  );
}
