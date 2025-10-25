import { useRouter } from "next/router";

import { useCallback, useMemo } from "react";
import React from "react";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
} from "lucide-react";

import { timeAgo } from "@/lib/utils";

import { Pagination } from "@/components/documents/pagination";
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

import { Skeleton } from "../ui/skeleton";

type Viewer = {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  totalVisits: number;
  lastViewed: Date | null;
};

export function ContactsTable({
  viewers,
  pagination,
  sorting,
  onPageChange,
  onPageSizeChange,
  onSortChange,
}: {
  viewers: Viewer[] | null | undefined;
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

  const data = useMemo(() => viewers || [], [viewers]);

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

      if (currentSortBy === columnId) {
        if (columnId === "lastViewed") {
          if (currentSortOrder === "asc") {
            onSortChange("lastViewed", "desc");
          } else {
            onSortChange("lastViewed", "asc");
          }
        } else {
          if (currentSortOrder === "asc") {
            onSortChange(columnId, "desc");
          } else if (currentSortOrder === "desc") {
            onSortChange("lastViewed", "desc");
          }
        }
      } else {
        onSortChange(columnId, "asc");
      }
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

  const columns: ColumnDef<Viewer>[] = useMemo(
    () => [
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
              onClick={() => handleSort("lastViewed")}
              className={getSortClass("lastViewed")}
            >
              Last Viewed
              {getSortIcon("lastViewed")}
            </Button>
          );
        },
        cell: ({ row }) => {
          const lastView = row.original.lastViewed;
          return lastView ? (
            <time
              dateTime={new Date(lastView).toISOString()}
              className="text-sm text-muted-foreground"
            >
              {timeAgo(lastView)}
            </time>
          ) : (
            <div className="text-sm text-muted-foreground">-</div>
          );
        },
      },
      {
        accessorKey: "totalVisits",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => handleSort("totalVisits")}
              className={getSortClass("totalVisits")}
            >
              Total Views
              {getSortIcon("totalVisits")}
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.original.totalVisits}
          </div>
        ),
      },
    ],
    [handleSort, getSortIcon, getSortClass],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  if (!viewers) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Last Viewed</TableHead>
              <TableHead>Total Views</TableHead>
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

      {pagination && pagination.totalItems > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          totalShownItems={data.length}
          itemName="visitors"
        />
      )}
    </div>
  );
}
