"use client";

import { useRouter } from "next/router";

import { useMemo, useState } from "react";
import React from "react";

import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VisitorAvatar } from "@/components/visitors/visitor-avatar";

import { timeAgo } from "@/lib/utils";

import { Skeleton } from "../ui/skeleton";
import { DataTablePagination } from "./data-table-pagination";

type Viewer = {
  id: string;
  email: string;
  views: { viewedAt: Date }[];
};

const columns: ColumnDef<Viewer>[] = [
  {
    accessorKey: "email",
    header: "Contact",
    cell: ({ row }) => (
      <div className="flex items-center overflow-visible sm:space-x-3">
        <VisitorAvatar viewerEmail={row.original.email} />
        <div className="min-w-0 flex-1">
          <div className="focus:outline-none">
            <p className="flex items-center gap-x-2 overflow-visible text-sm font-medium text-gray-800 dark:text-gray-200">
              {row.original.email}
            </p>
          </div>
        </div>
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
    cell: ({ row }) => {
      const lastView = row.original.views[0];
      return lastView ? (
        <time
          dateTime={new Date(lastView.viewedAt).toISOString()}
          className="text-sm text-muted-foreground"
        >
          {timeAgo(lastView.viewedAt)}
        </time>
      ) : (
        <div className="text-sm text-muted-foreground">-</div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const dateA = rowA.original.views[0]?.viewedAt;
      const dateB = rowB.original.views[0]?.viewedAt;

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      const timeA =
        dateA instanceof Date ? dateA.getTime() : new Date(dateA).getTime();
      const timeB =
        dateB instanceof Date ? dateB.getTime() : new Date(dateB).getTime();

      return timeB - timeA; // Sort in descending order (most recent first)
    },
  },
  {
    accessorKey: "totalVisits",
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
          Total Visits
          {column.getIsSorted() === "asc" ? (
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronUpIcon className="ml-2 h-4 w-4" />
          ) : (
            <ChevronsUpDownIcon className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.views.length}
      </div>
    ),
    sortingFn: (rowA, rowB) =>
      rowA.original.views.length - rowB.original.views.length,
  },
];

export function ContactsTable({
  viewers,
}: {
  viewers: Viewer[] | null | undefined;
}) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "lastViewed", desc: false },
  ]);

  const data = useMemo(() => viewers || [], [viewers]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: (updater) => {
      setSorting((old) => {
        const newSorting =
          typeof updater === "function" ? updater(old) : updater;
        if (newSorting.length > 0) {
          const [{ id, desc }] = newSorting;
          const prevSorting = old.find((s) => s.id === id);
          if (prevSorting) {
            if (prevSorting.desc && !desc) {
              // If it was descending and now ascending, reset
              return [];
            }
          }
        }
        return newSorting;
      });
    },
    state: {
      sorting,
    },
  });

  if (!viewers) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Last Viewed</TableHead>
              <TableHead>Total Visits</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[50px]" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  const handleRowClick = (id: string) => {
    router.push(`/visitors/${id}`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
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
                  onClick={() => handleRowClick(row.original.id)}
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No visitors yet.
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
