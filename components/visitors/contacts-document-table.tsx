"use client";

import { useRouter } from "next/router";

import { useMemo, useState } from "react";
import React from "react";

import {
  ColumnDef,
  ExpandedState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { durationFormat, timeAgo } from "@/lib/utils";
import { fileIcon } from "@/lib/utils/get-file-icon";

import { DataTablePagination } from "./data-table-pagination";

type DocumentView = {
  documentId: string;
  document: {
    name: string;
    type: string;
  };
  lastViewed: Date;
  totalDuration: number;
  viewCount: number;
};

const columns: ColumnDef<DocumentView>[] = [
  {
    accessorKey: "document",
    header: "Document Name",
    cell: ({ row }) => {
      const view = row.original;
      return (
        <div className="flex items-center overflow-visible sm:space-x-3">
          {fileIcon({
            fileType: view.document.type ?? "",
            className: "h-7 w-7",
            isLight: true,
          })}
          <div className="min-w-0 flex-1">
            <div className="focus:outline-none">
              <p className="flex items-center gap-x-2 overflow-visible text-sm font-medium text-gray-800 dark:text-gray-200">
                {view.document.name}
              </p>
            </div>
          </div>
        </div>
      );
    },
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
      const view = row.original;
      return (
        <time dateTime={new Date(view.lastViewed).toISOString()}>
          {timeAgo(view.lastViewed)}
        </time>
      );
    },
    sortingFn: (rowA, rowB) => {
      return (
        new Date(rowB.original.lastViewed).getTime() -
        new Date(rowA.original.lastViewed).getTime()
      );
    },
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
    cell: ({ row }) => {
      const view = row.original;
      return (
        <div className="text-sm text-muted-foreground">
          {durationFormat(view.totalDuration)}
        </div>
      );
    },
  },
  {
    accessorKey: "viewCount",
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
          Visits
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
      const view = row.original;
      return (
        <div className="text-sm text-muted-foreground">{view.viewCount}</div>
      );
    },
  },
  // INFO: disable for now until we have more details
  // {
  //   id: "expander",
  //   header: () => null,
  //   cell: ({ row }) => {
  //     return (
  //       <Button
  //         variant="ghost"
  //         onClick={() => {
  //           row.toggleExpanded();
  //         }}
  //         className="p-0"
  //       >
  //         {row.getIsExpanded() ? (
  //           <ChevronUpIcon className="h-4 w-4" />
  //         ) : (
  //           <ChevronDownIcon className="h-4 w-4" />
  //         )}
  //       </Button>
  //     );
  //   },
  // },
];

export function ContactsDocumentsTable({
  views,
}: {
  views: DocumentView[] | null | undefined;
}) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "lastViewed", desc: false },
  ]);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const data = useMemo(() => views || [], [views]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
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
    onExpandedChange: setExpanded,
    state: {
      sorting,
      expanded,
    },
  });

  if (!views) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Name</TableHead>
              <TableHead>Last Viewed</TableHead>
              <TableHead>Time Spent</TableHead>
              <TableHead>Visits</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-7 w-7" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[50px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  const handleRowClick = (id: string) => {
    router.push(`/documents/${id}`);
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
                <React.Fragment key={row.id}>
                  <TableRow
                    key={row.id}
                    onClick={() => handleRowClick(row.original.documentId)}
                    className="cursor-pointer"
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
                  {row.getIsExpanded() && (
                    <TableRow>
                      <TableCell colSpan={columns.length}>
                        {/* Placeholder for expanded content */}
                        <div className="p-4">
                          <h4 className="mb-2 font-semibold">
                            Additional Details
                          </h4>
                          <p>Chart placeholder</p>
                          <p>Rows of all visits placeholder</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No visits yet.
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
