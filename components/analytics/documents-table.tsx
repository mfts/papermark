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
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
  Download,
  FileIcon,
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
import { DataTablePagination } from "@/components/visitors/data-table-pagination";

import { usePlan } from "@/lib/swr/use-billing";
import { fetcher, timeAgo } from "@/lib/utils";
import { downloadCSV } from "@/lib/utils/csv";
import { UpgradeButton } from "../ui/upgrade-button";


interface Document {
  id: string;
  name: string;
  views: number;
  avgDuration: string;
  lastViewed: Date | null;
}

const columns: ColumnDef<Document>[] = [
  {
    accessorKey: "name",
    header: "Documents",
    cell: ({ row }) => (
      <div className="flex items-center overflow-visible sm:space-x-3">
        <div className="min-w-0 flex-1">
          <div className="focus:outline-none">
            <Link
              href={`/documents/${row.original.id}`}
              className="flex items-center gap-x-2 overflow-visible text-sm font-medium text-gray-800 hover:text-gray-600 dark:text-gray-200 dark:hover:text-gray-400"
            >
              {row.original.name}
            </Link>
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "views",
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
          Views
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
      <div className="text-sm text-muted-foreground">{row.original.views}</div>
    ),
  },
  {
    accessorKey: "avgDuration",
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
          Avg Duration
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
        {row.original.avgDuration}
      </div>
    ),
  },
  {
    accessorKey: "lastViewed",
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
      <div className="text-sm text-muted-foreground">
        {row.original.lastViewed ? timeAgo(row.original.lastViewed) : "-"}
      </div>
    ),
  },
];

export default function DocumentsTable({
  startDate,
  endDate,
}: {
  startDate: Date;
  endDate: Date;
}) {
  const router = useRouter();
  const teamInfo = useTeam();
  const { isTrial, isFree } = usePlan();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "lastViewed", desc: true },
  ]);

  const interval = router.query.interval || "24h";
  const { data: documents, isLoading } = useSWR<Document[]>(
    teamInfo?.currentTeam?.id
      ? `/api/analytics?type=documents&interval=${interval}&teamId=${teamInfo.currentTeam.id}${interval === "custom" ? `&startDate=${format(startDate, "MM-dd-yyyy")}&endDate=${format(endDate, "MM-dd-yyyy")}` : ""}`
      : null,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  const table = useReactTable({
    data: documents || [],
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

    if (!documents?.length) {
      toast.error("No data to export");
      return;
    }

    const exportData = documents.map((doc) => ({
      "Document Name": doc.name,
      Views: doc.views,
      "Average Duration": doc.avgDuration,
      "Last Viewed": doc.lastViewed
        ? new Date(doc.lastViewed).toISOString()
        : "Never",
    }));

    downloadCSV(exportData, "documents");
  };

  const UpgradeOrExportButton = () => {
    if (isFree && !isTrial) {
      return (
        <UpgradeButton
          text="Export"
          clickedPlan={PlanEnum.Pro}
          trigger="dashboard_documents_export"
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
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
                        <FileIcon className="size-6" />
                      </div>
                    </div>
                    <p>No visited documents in the last {interval}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} name="document" />
    </div>
  );
}
