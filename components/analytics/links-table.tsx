import Link from "next/link";
import { useRouter } from "next/router";

import { useEffect, useState } from "react";

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
  Check,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
  Copy,
  Download,
  Link2Icon,
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
import { cn, timeAgo } from "@/lib/utils";
import { fetcher } from "@/lib/utils";
import { downloadCSV } from "@/lib/utils/csv";

import { UpgradeButton } from "../ui/upgrade-button";

interface Link {
  id: string;
  name: string;
  url: string;
  documentName: string;
  documentId: string;
  views: number;
  avgDuration: string;
  lastViewed: Date | null;
}

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      toast.success("Link copied to clipboard");
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-6 hover:bg-transparent"
      onClick={() => {
        navigator.clipboard.writeText(url);
        setCopied(true);
      }}
    >
      {copied ? (
        <Check className="!size-4 text-emerald-500" />
      ) : (
        <Copy className="!size-4 text-muted-foreground" />
      )}
    </Button>
  );
}

const columns: ColumnDef<Link>[] = [
  {
    accessorKey: "name",
    header: "Links",
    cell: ({ row }) => (
      <div className="flex items-center overflow-visible sm:space-x-3">
        <div className="min-w-0 flex-1">
          <div className="focus:outline-none">
            <p className="flex items-center gap-x-2 overflow-visible text-sm font-medium text-gray-800 dark:text-gray-200">
              {row.original.name}
            </p>
            <div className="flex items-center gap-x-1">
              <p className="text-sm text-muted-foreground">
                {row.original.url}
              </p>
              <CopyButton url={row.original.url} />
            </div>
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
    accessorKey: "views",
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
          className={cn(
            column.getIsSorted()
              ? "text-nowrap font-medium"
              : "text-nowrap font-normal",
            "px-0",
          )}
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
      <div className="text-sm text-muted-foreground">
        {row.original.lastViewed ? timeAgo(row.original.lastViewed) : "-"}
      </div>
    ),
  },
];

export default function LinksTable({
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

  const interval = router.query.interval || "7d";
  const { data: links, isLoading } = useSWR<Link[]>(
    teamInfo?.currentTeam?.id
      ? `/api/analytics?type=links&interval=${interval}&teamId=${teamInfo.currentTeam.id}${interval === "custom" ? `&startDate=${format(startDate, "MM-dd-yyyy")}&endDate=${format(endDate, "MM-dd-yyyy")}` : ""}`
      : null,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  const table = useReactTable({
    data: links || [],
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

    if (!links?.length) {
      toast.error("No data to export");
      return;
    }

    const exportData = links.map((link) => ({
      "Link Name": link.name,
      URL: link.url,
      Document: link.documentName,
      Views: link.views,
      "Average Duration": link.avgDuration,
      "Last Viewed": link.lastViewed
        ? new Date(link.lastViewed).toISOString()
        : "Never",
    }));

    downloadCSV(exportData, "links");
  };

  const UpgradeOrExportButton = () => {
    if (isFree && !isTrial) {
      return (
        <UpgradeButton
          text="Export"
          clickedPlan={PlanEnum.Pro}
          trigger="dashboard_links_export"
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
                        <Link2Icon className="size-6" />
                      </div>
                    </div>
                    <p>
                      No visited links in the last{" "}
                      {interval === "custom"
                        ? `From ${format(startDate, "PP")} to ${format(endDate, "PP")}`
                        : interval}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} name="link" />
    </div>
  );
}
