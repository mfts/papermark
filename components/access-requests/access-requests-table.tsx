import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { AccessRequest, AccessRequestStatus } from "@prisma/client";
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
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
  MailIcon,
  MoreHorizontalIcon,
  ShieldBanIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import { timeAgo } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ButtonTooltip } from "@/components/ui/tooltip";
import { DataTablePagination } from "@/components/visitors/data-table-pagination";

type AccessRequestWithDetails = AccessRequest & {
  link: {
    id: string;
    name: string;
    linkType: string;
    allowList: string[];
    denyList: string[];
    document?: { name: string };
    dataroom?: { name: string };
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  };
};

interface AccessRequestApprovalResponse extends AccessRequestWithDetails {
  notificationMessage?: string;
}

interface AccessRequestDenyResponse {
  success: boolean;
}

interface AccessRequestDeleteResponse {
  success: boolean;
}

const getStatusVariant = (status: AccessRequestStatus) => {
  switch (status) {
    case "PENDING":
      return "pending";
    case "APPROVED":
      return "success";
    case "DENIED":
      return "error";
    default:
      return "neutral";
  }
};

const getContentName = (request: AccessRequestWithDetails) => {
  if (request.link.linkType === "DOCUMENT_LINK") {
    return request.link.document?.name || request.link.name || "Document";
  }
  return request.link.dataroom?.name || request.link.name || "Dataroom";
};

const getContentType = (request: AccessRequestWithDetails) => {
  return request.link.linkType === "DOCUMENT_LINK" ? "Document" : "Dataroom";
};

const isEmailInDenyList = (email: string, denyList: string[]) => {
  if (!denyList || denyList.length === 0) return false;

  const emailDomain = email.substring(email.lastIndexOf("@"));
  return denyList.some((denied) => {
    return (
      denied === email || (denied.startsWith("@") && emailDomain === denied)
    );
  });
};

export function AccessRequestsTable({
  accessRequests,
}: {
  accessRequests: AccessRequestWithDetails[] | null | undefined;
}) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "requestedAt", desc: true },
  ]);
  const [approveDialog, setApproveDialog] = useState<{
    open: boolean;
    request: AccessRequestWithDetails | null;
  }>({
    open: false,
    request: null,
  });
  const { currentTeam } = useTeam();

  const handleApproveClick = (request: AccessRequestWithDetails) => {
    setApproveDialog({
      open: true,
      request,
    });
  };

  const handleApproveConfirm = async () => {
    if (!currentTeam || !approveDialog.request) return;

    const approvePromise = fetch(
      `/api/teams/${currentTeam.id}/access-requests`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: approveDialog.request.id,
          action: "approve",
        }),
      },
    ).then(async (response) => {
      if (!response.ok) {
        throw new Error("Failed to approve access request");
      }
      const result: AccessRequestApprovalResponse = await response.json();
      mutate(`/api/teams/${currentTeam.id}/access-requests`);
      setApproveDialog({ open: false, request: null });

      if (result.notificationMessage) {
        toast.info(result.notificationMessage);
      }

      return result;
    });

    toast.promise(approvePromise, {
      loading: "Approving access request...",
      success: "Access request approved",
      error: "Failed to approve access request",
    });
  };

  const handleDeny = async (requestId: string) => {
    if (!currentTeam) return;

    const denyPromise = fetch(`/api/teams/${currentTeam.id}/access-requests`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId,
        action: "deny",
      }),
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error("Failed to deny access request");
      }
      mutate(`/api/teams/${currentTeam.id}/access-requests`);
      const result: AccessRequestDenyResponse = await response.json();
      return result;
    });

    toast.promise(denyPromise, {
      loading: "Denying access request...",
      success: "Access request denied",
      error: "Failed to deny access request",
    });
  };

  const handleDelete = async (requestId: string) => {
    if (!currentTeam) return;

    const deletePromise = fetch(
      `/api/teams/${currentTeam.id}/access-requests`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
        }),
      },
    ).then(async (response) => {
      if (!response.ok) {
        throw new Error("Failed to delete access request");
      }
      mutate(`/api/teams/${currentTeam.id}/access-requests`);
      const result: AccessRequestDeleteResponse = await response.json();
      return result;
    });

    toast.promise(deletePromise, {
      loading: "Deleting access request...",
      success: "Access request deleted",
      error: "Failed to delete access request",
    });
  };

  const columns: ColumnDef<AccessRequestWithDetails>[] = [
    {
      accessorKey: "email",
      header: "Requester",
      cell: ({ row }) => {
        const request = row.original;
        const isBlocked = isEmailInDenyList(
          request.email,
          request.link.denyList,
        );

        return (
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
              <MailIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {request.email}
                </div>
                {isBlocked && (
                  <ButtonTooltip content="This email is in the block list for this link. You can still approve access if desired.">
                    <div className="flex items-center space-x-1 rounded-full bg-red-100 px-2 py-1 dark:bg-red-900/20">
                      <ShieldBanIcon className="h-3 w-3 text-red-600 dark:text-red-400" />
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">
                        Blocked
                      </span>
                    </div>
                  </ButtonTooltip>
                )}
              </div>
              {request.message && (
                <div className="max-w-[200px] truncate text-xs text-muted-foreground/60">
                  &quot;{request.message}&quot;
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "content",
      header: "Content",
      cell: ({ row }) => {
        const request = row.original;
        const contentName = getContentName(request);
        const contentType = getContentType(request);

        return (
          <div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {contentName}
            </div>
            <div className="text-xs text-muted-foreground/60">
              {contentType} •{" "}
              {request.link.name || `Link #${request.link.id.slice(-5)}`}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
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
            Status
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
        const status = row.original.status;
        if (!status)
          return <span className="text-sm text-muted-foreground">-</span>;

        return (
          <StatusBadge variant={getStatusVariant(status)}>
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </StatusBadge>
        );
      },
    },
    {
      accessorKey: "requestedAt",
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
            Requested
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
          {timeAgo(row.original.requestedAt)}
        </div>
      ),
    },
    {
      accessorKey: "respondedAt",
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
            Responded
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
        if (!row.original.respondedAt) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }
        return (
          <div>
            <div className="text-sm text-muted-foreground">
              {timeAgo(row.original.respondedAt)}
            </div>
            {row.original.approver && (
              <div className="text-xs text-muted-foreground/60">
                by {row.original.approver.name || row.original.approver.email}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const request = row.original;
        const isPending = request.status === "PENDING";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 group-hover/row:ring-1 group-hover/row:ring-gray-200 group-hover/row:dark:ring-gray-700"
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {isPending && (
                <>
                  <DropdownMenuItem onClick={() => handleApproveClick(request)}>
                    <CheckIcon className="h-4 w-4" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeny(request.id)}>
                    <XIcon className="h-4 w-4" />
                    Deny
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={() => handleDelete(request.id)}
                className="text-destructive"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: accessRequests || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Generate the approval dialog description
  const getApprovalDescription = (request: AccessRequestWithDetails | null) => {
    if (!request) return "";

    const linkName = request.link.name || "this link";
    const isBlocked = isEmailInDenyList(request.email, request.link.denyList);

    if (isBlocked) {
      return `This will remove ${request.email} from the block list and add them to the allow list for "${linkName} link". They will receive an email notification with access to the content.`;
    }

    return `This will add ${request.email} to the allow list for "${linkName}" link. They will receive an email notification with access to the content.`;
  };

  if (!accessRequests) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="*:whitespace-nowrap *:font-medium hover:bg-transparent">
                <TableHead>Requester</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Responded</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="mt-1 h-3 w-[150px]" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[180px]" />
                    <Skeleton className="mt-1 h-3 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[80px] rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 rounded" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (accessRequests.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="*:whitespace-nowrap *:font-medium hover:bg-transparent">
              <TableHead>Requester</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Responded</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No access requests found.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="*:whitespace-nowrap *:font-medium hover:bg-transparent"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
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
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group/row"
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
              ))}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination table={table} name="access request" />
      </div>

      {/* Approval Confirmation Dialog */}
      <AlertDialog
        open={approveDialog.open}
        onOpenChange={(open) =>
          setApproveDialog({
            open,
            request: open ? approveDialog.request : null,
          })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Access Request</AlertDialogTitle>
            <AlertDialogDescription>
              {getApprovalDescription(approveDialog.request)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveConfirm}>
              Yes, Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}