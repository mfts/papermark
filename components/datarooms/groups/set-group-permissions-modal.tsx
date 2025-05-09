import { useEffect, useMemo, useState } from "react";

import { useTeam } from "@/context/team-context";
import { ItemType } from "@prisma/client";
import {
  ArrowDownToLineIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  FileTextIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import useDataroomGroups from "@/lib/swr/use-dataroom-groups";
import { cn } from "@/lib/utils";

import CloudDownloadOff from "@/components/shared/icons/cloud-download-off";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type GroupPermissions = Record<string, { view: boolean; download: boolean }>;

export function SetGroupPermissionsModal({
  open,
  setOpen,
  dataroomId,
  onComplete,
  isAutoOpen,
  uploadedFiles,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  dataroomId: string;
  onComplete?: () => void;
  isAutoOpen?: boolean;
  uploadedFiles: {
    documentId: string;
    dataroomDocumentId: string;
    fileName: string;
  }[];
}) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const [selectedFile, setSelectedFile] = useState<{
    documentId: string;
    dataroomDocumentId: string;
    fileName: string;
  } | null>(null);
  const [showFileList, setShowFileList] = useState<boolean>(
    uploadedFiles.length > 1,
  );

  const currentDocumentId = useMemo(() => {
    return selectedFile?.documentId || uploadedFiles[0]?.documentId;
  }, [selectedFile, uploadedFiles]);

  const currentDataroomDocumentId = useMemo(() => {
    return (
      selectedFile?.dataroomDocumentId || uploadedFiles[0]?.dataroomDocumentId
    );
  }, [selectedFile, uploadedFiles]);

  const {
    viewerGroups,
    loading: viewerGroupsLoading,
    mutate: mutateGroups,
  } = useDataroomGroups({
    documentId: currentDataroomDocumentId,
  });
  const [loading, setLoading] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<GroupPermissions>({});

  useEffect(() => {
    if (uploadedFiles.length === 1) {
      setSelectedFile(uploadedFiles[0]);
      setShowFileList(false);
    } else {
      setShowFileList(true);
    }
  }, [uploadedFiles]);

  useEffect(() => {
    if (selectedFile) {
      mutateGroups();
    }
  }, [selectedFile, mutateGroups]);

  useEffect(() => {
    if (viewerGroups) {
      const initialGroups = viewerGroups.reduce<GroupPermissions>(
        (acc, group) => ({
          ...acc,
          [group.id]: {
            view: group.accessControls?.[0]?.canView ?? false,
            download: group.accessControls?.[0]?.canDownload ?? false,
          },
        }),
        {},
      );
      setSelectedGroups(initialGroups);
    }
  }, [viewerGroups]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await Promise.all(
        Object.entries(selectedGroups).map(([groupId, permissions]) => {
          return fetch(
            `/api/teams/${teamId}/datarooms/${dataroomId}/groups/${groupId}/permissions`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                dataroomId,
                groupId,
                permissions: {
                  [currentDataroomDocumentId]: {
                    itemType: ItemType.DATAROOM_DOCUMENT,
                    view: permissions.view,
                    download: permissions.download,
                  },
                },
              }),
            },
          );
        }),
      );

      toast.success("Group permissions updated successfully!");

      await Promise.all([
        mutateGroups(),
        mutate(
          `/api/teams/${teamId}/datarooms/${dataroomId}/groups?documentId=${currentDocumentId}`,
        ),
      ]);

      if (uploadedFiles.length > 1) {
        setShowFileList(true);
      } else {
        onComplete?.();
        setOpen(false);
      }
    } catch (error) {
      console.error("Error updating group permissions:", error);
      toast.error("Failed to update group permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowFileList(true);
  };

  const updatePermissions = (groupId: string, newPermissions: string[]) => {
    const hasView = newPermissions.includes("view");
    const hasDownload = newPermissions.includes("download");

    const prevPermissions = selectedGroups[groupId] || {
      view: false,
      download: false,
    };

    if (
      hasDownload &&
      !hasView &&
      !prevPermissions.view &&
      !prevPermissions.download
    ) {
      newPermissions = ["view", "download"];
    } else if (hasDownload && !hasView) {
      newPermissions = [];
    }

    setSelectedGroups((prev) => ({
      ...prev,
      [groupId]: {
        view: newPermissions.includes("view"),
        download: newPermissions.includes("download"),
      },
    }));
  };

  const handleFileSelect = (file: (typeof uploadedFiles)[0]) => {
    setSelectedFile(file);
    setShowFileList(false);
    mutateGroups();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="w-[90%]">
          <div className="flex items-center gap-2">
            {!showFileList && uploadedFiles.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-8 w-8"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
            )}
            <div>
              <DialogTitle>Set Group Permissions</DialogTitle>
              <DialogDescription>
                {showFileList
                  ? "Select a file to set permissions"
                  : "Update group permissions for the selected file"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {showFileList ? (
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.documentId}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-lg border p-3",
                  selectedFile?.documentId === file.documentId
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50",
                )}
                onClick={() => handleFileSelect(file)}
              >
                <div className="flex items-center space-x-3">
                  <FileTextIcon className="h-5 w-5" />
                  <span>{file.fileName}</span>
                </div>
                {selectedFile?.documentId === file.documentId && (
                  <div className="text-sm text-primary">Selected</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <>
            <div>
              <p className="text-sm font-medium">Selected File</p>
              <div className="mt-1 flex items-center space-x-2 rounded-lg border p-3">
                <FileTextIcon className="h-5 w-5" />
                <span>
                  {selectedFile?.fileName || uploadedFiles[0]?.fileName}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="rounded-md border">
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-secondary">
                      <TableRow>
                        <TableHead className="w-[60%]">Group</TableHead>
                        <TableHead className="w-[20%] text-center">
                          View
                        </TableHead>
                        <TableHead className="w-[20%] text-center">
                          Download
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="relative">
                      {viewerGroupsLoading ? (
                        <TableRow>
                          <TableCell colSpan={3} className="w-full text-center">
                            <Loader2 className="m-auto h-5 w-5 animate-spin" />
                          </TableCell>
                        </TableRow>
                      ) : viewerGroups && viewerGroups.length > 0 ? (
                        viewerGroups?.map((group) => (
                          <TableRow key={group.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{group.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {group._count.members} members
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <ToggleGroup
                                type="multiple"
                                value={Object.entries(
                                  selectedGroups[group.id] || {},
                                )
                                  .filter(
                                    ([key, value]) => key === "view" && value,
                                  )
                                  .map(([key, _]) => key)}
                                onValueChange={(value) => {
                                  const currentPermissions = Object.entries(
                                    selectedGroups[group.id] || {},
                                  )
                                    .filter(([_, val]) => val)
                                    .map(([key, _]) => key);

                                  if (
                                    currentPermissions.includes("view") &&
                                    !value.includes("view")
                                  ) {
                                    const newPerms = currentPermissions.filter(
                                      (p) => p !== "view" && p !== "download",
                                    );
                                    updatePermissions(group.id, newPerms);
                                  } else if (
                                    !currentPermissions.includes("view") &&
                                    value.includes("view")
                                  ) {
                                    const newPerms = [
                                      ...currentPermissions,
                                      "view",
                                    ];
                                    updatePermissions(group.id, newPerms);
                                  }
                                }}
                                className="justify-center"
                              >
                                <ToggleGroupItem
                                  value="view"
                                  aria-label="Toggle view"
                                  size="sm"
                                  className={cn(
                                    "px-3 py-1 text-muted-foreground hover:ring-1 hover:ring-gray-400 data-[state=on]:bg-foreground data-[state=on]:text-background",
                                    selectedGroups[group.id]?.view
                                      ? "data-[state=on]:bg-foreground data-[state=on]:text-background"
                                      : "",
                                  )}
                                >
                                  {selectedGroups[group.id]?.view ? (
                                    <EyeIcon className="h-5 w-5" />
                                  ) : (
                                    <EyeOffIcon className="h-5 w-5" />
                                  )}
                                </ToggleGroupItem>
                              </ToggleGroup>
                            </TableCell>
                            <TableCell className="text-center">
                              <ToggleGroup
                                type="multiple"
                                value={Object.entries(
                                  selectedGroups[group.id] || {},
                                )
                                  .filter(
                                    ([key, value]) =>
                                      key === "download" && value,
                                  )
                                  .map(([key, _]) => key)}
                                onValueChange={(value) => {
                                  const currentPermissions = Object.entries(
                                    selectedGroups[group.id] || {},
                                  )
                                    .filter(([_, val]) => val)
                                    .map(([key, _]) => key);

                                  if (
                                    value.includes("download") &&
                                    !currentPermissions.includes("view")
                                  ) {
                                    const newPerms = [
                                      ...currentPermissions,
                                      "view",
                                      "download",
                                    ];
                                    updatePermissions(group.id, newPerms);
                                  } else {
                                    const newPerms = currentPermissions.filter(
                                      (p) => p !== "download",
                                    );
                                    if (value.includes("download")) {
                                      newPerms.push("download");
                                    }
                                    updatePermissions(group.id, newPerms);
                                  }
                                }}
                                className="justify-center"
                              >
                                <ToggleGroupItem
                                  value="download"
                                  aria-label="Toggle download"
                                  size="sm"
                                  className={cn(
                                    "px-3 py-1 text-muted-foreground hover:ring-1 hover:ring-gray-400 data-[state=on]:bg-foreground data-[state=on]:text-background",
                                    selectedGroups[group.id]?.download
                                      ? "data-[state=on]:bg-foreground data-[state=on]:text-background"
                                      : "",
                                  )}
                                >
                                  {selectedGroups[group.id]?.download ? (
                                    <ArrowDownToLineIcon className="h-5 w-5" />
                                  ) : (
                                    <CloudDownloadOff className="h-5 w-5" />
                                  )}
                                </ToggleGroupItem>
                              </ToggleGroup>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : !viewerGroupsLoading && viewerGroups?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="w-full text-center">
                            No groups found
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="submit"
                  loading={loading}
                  disabled={!viewerGroups || viewerGroups.length === 0}
                >
                  Save permissions
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
