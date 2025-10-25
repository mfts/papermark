import { useRouter } from "next/router";

import { useCallback, useMemo, useState } from "react";
import React from "react";

import {
  ColumnDef,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
} from "lucide-react";

import { durationFormat, timeAgo } from "@/lib/utils";
import { fileIcon } from "@/lib/utils/get-file-icon";

import { Pagination } from "@/components/documents/pagination";
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

type ViewerView = {
  documentId: string;
  document: {
    name: string | null;
    type: string | null;
  };
  lastViewed: Date;
  totalDuration: number;
  viewCount: number;
};

export function ContactsDocumentsTable({
  views,
  durations = {},
  loadingDurations = false,
  pagination,
  sorting,
  onPageChange,
  onPageSizeChange,
  onSortChange,
}: {
  views: ViewerView[] | null | undefined;
  durations?: Record<string, number>;
  loadingDurations?: boolean;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  sorting?: {
    sortBy: string;
    sortOrder: string;
  };
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSortChange?: (sortBy: string, sortOrder: string) => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const data = useMemo(() => views || [], [views]);

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (size: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(size);
    }
  };

  const handleSort = useCallback(
    (columnId: string) => {
      if (!onSortChange) return;

      const currentSortBy = sorting?.sortBy;
      const currentSortOrder = sorting?.sortOrder;

      let newSortOrder = "desc";
      if (currentSortBy === columnId) {
        if (currentSortOrder === "desc") {
          newSortOrder = "asc";
        } else if (currentSortOrder === "asc") {
          onSortChange("lastViewed", "desc");
          return;
        }
      }

      onSortChange(columnId, newSortOrder);
    },
    [onSortChange, sorting?.sortBy, sorting?.sortOrder],
  );

  const getSortIcon = useCallback(
    (columnId: string) => {
      const currentSortBy = sorting?.sortBy;
      const currentSortOrder = sorting?.sortOrder;

      if (currentSortBy !== columnId) {
        return <ChevronsUpDownIcon className="ml-2 h-4 w-4" />;
      }

      return currentSortOrder === "asc" ? (
        <ChevronUpIcon className="ml-2 h-4 w-4" />
      ) : (
        <ChevronDownIcon className="ml-2 h-4 w-4" />
      );
    },
    [sorting?.sortBy, sorting?.sortOrder],
  );

  const getSortClass = useCallback(
    (columnId: string) => {
      const currentSortBy = sorting?.sortBy;
      return currentSortBy === columnId
        ? "text-nowrap font-medium"
        : "text-nowrap font-normal";
    },
    [sorting?.sortBy],
  );

  const columns: ColumnDef<ViewerView>[] = useMemo(
    () => [
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
              onClick={() => handleSort("lastViewed")}
              className={getSortClass("lastViewed")}
            >
              Last Viewed
              {getSortIcon("lastViewed")}
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
              onClick={() => handleSort("totalDuration")}
              className={getSortClass("totalDuration")}
            >
              Time Spent
              {getSortIcon("totalDuration")}
            </Button>
          );
        },
        cell: ({ row }) => {
          const view = row.original;
          const duration = durations[view.documentId] ?? view.totalDuration;
          const isLoading = loadingDurations && !(view.documentId in durations);

          if (isLoading) {
            return <Skeleton className="h-4 w-16" />;
          }

          return (
            <div className="text-sm text-muted-foreground">
              {durationFormat(duration)}
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
              onClick={() => handleSort("viewCount")}
              className={getSortClass("viewCount")}
            >
              Visits
              {getSortIcon("viewCount")}
            </Button>
          );
        },
        cell: ({ row }) => {
          const view = row.original;
          return <span>{view.viewCount}</span>;
        },
      },
    ],
    [durations, loadingDurations, handleSort, getSortIcon, getSortClass],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setExpanded,
    state: {
      expanded,
    },
    manualPagination: true,
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
              <TableHead>Views</TableHead>
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
                <TableRow
                  key={row.id}
                  onClick={() => handleRowClick(row.original.documentId)}
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
                  No documents viewed yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalItems > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          totalShownItems={data.length}
          itemName="documents"
        />
      )}
    </div>
  );
}
