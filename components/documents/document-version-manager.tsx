import { useState } from "react";

import { format } from "date-fns";
import {
  Calendar,
  Download,
  HardDrive,
  MoreHorizontal,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  DocumentVersion,
  useDocumentVersionActions,
  useDocumentVersions,
} from "@/lib/swr/use-document-versions";
import { bytesToSize } from "@/lib/utils";

import { Pagination } from "@/components/documents/pagination";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentVersionManagerProps {
  documentId: string;
}

export function DocumentVersionManager({
  documentId,
}: DocumentVersionManagerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { versions, loading, error, mutate } = useDocumentVersions(
    documentId,
    currentPage,
    pageSize,
  );
  const { deleteVersion, promoteVersion, downloadVersion } =
    useDocumentVersionActions(documentId);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] =
    useState<DocumentVersion | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleDelete = async () => {
    if (!selectedVersion) return;

    setActionLoading(true);
    const success = await deleteVersion(selectedVersion.id);
    if (success) {
      mutate();
    }
    setActionLoading(false);
    setDeleteDialogOpen(false);
    setSelectedVersion(null);
  };

  const handlePromote = async () => {
    if (!selectedVersion) return;

    setActionLoading(true);
    const success = await promoteVersion(selectedVersion.id);
    if (success) {
      mutate();
    }
    setActionLoading(false);
    setPromoteDialogOpen(false);
    setSelectedVersion(null);
  };

  const handleDownload = async (version: DocumentVersion) => {
    if (version.type === "notion" || version.type === "video") {
      toast.error("Notion and video versions cannot be downloaded");
      return;
    }

    await downloadVersion(version.id);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Document Versions
          </CardTitle>
          <CardDescription className="text-sm">
            Loading document versions...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Document Versions
          </CardTitle>
          <CardDescription className="text-sm text-red-600">
            Failed to load document versions. Please try again.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!versions?.versions.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Document Versions
          </CardTitle>
          <CardDescription className="text-sm">
            No versions found for this document
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Document Versions
          </CardTitle>
          <CardDescription className="text-sm">
            Manage different versions of &quot;{versions.documentName}&quot;
            {!versions.canManageVersions && (
              <span className="mt-1 block text-xs text-amber-600">
                Only admin and manager users can delete or promote versions
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {versions.versions.map((version) => (
            <div
              key={version.id}
              className="group/row flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Version {version.versionNumber}
                  </span>
                  {version.isPrimary && (
                    <Badge
                      variant="default"
                      className="flex items-center gap-1 text-xs"
                    >
                      <Star className="h-3 w-3 fill-current" />
                      Primary
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(
                      new Date(version.createdAt),
                      "MMM d, yyyy 'at' h:mm a",
                    )}
                  </div>

                  {version.fileSize > 0 && (
                    <div className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {bytesToSize(version.fileSize)}
                    </div>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover/row:opacity-100 group-hover/row:ring-1 group-hover/row:ring-gray-200 data-[state=open]:opacity-100 group-hover/row:dark:ring-gray-700"
                  >
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => handleDownload(version)}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </DropdownMenuItem>

                  {version.canPromote && (
                    <>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedVersion(version);
                          setPromoteDialogOpen(true);
                        }}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Star className="h-4 w-4" />
                        Promote to Primary
                      </DropdownMenuItem>
                    </>
                  )}

                  {version.canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedVersion(version);
                          setDeleteDialogOpen(true);
                        }}
                        className="flex items-center gap-2 text-sm text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Version
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </CardContent>
      </Card>

      {versions?.pagination && versions.pagination.totalItems > 0 && (
        <Pagination
          currentPage={versions.pagination.currentPage}
          pageSize={versions.pagination.pageSize}
          totalItems={versions.pagination.totalItems}
          totalPages={versions.pagination.totalPages}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          totalShownItems={versions.versions.length}
          itemName="version"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Delete Version {selectedVersion?.versionNumber}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This action cannot be undone. This will permanently delete version{" "}
              {selectedVersion?.versionNumber} of the document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading} className="text-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-destructive text-sm text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? "Deleting..." : "Delete Version"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote Confirmation Dialog */}
      <AlertDialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Promote Version {selectedVersion?.versionNumber}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will make version {selectedVersion?.versionNumber} the
              primary version. All links to this document will use this version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading} className="text-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePromote}
              disabled={actionLoading}
              className="text-sm"
            >
              {actionLoading ? "Promoting..." : "Promote to Primary"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
