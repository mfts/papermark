import { useCallback, useEffect, useMemo, useState } from "react";

import { useTeam } from "@/context/team-context";
import { ItemType } from "@prisma/client";
import {
  ArrowDownToLineIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  FileTextIcon,
  LinkIcon,
  Loader2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import { useDataroomLinks } from "@/lib/swr/use-dataroom";
import useDataroomGroups from "@/lib/swr/use-dataroom-groups";
import useDataroomPermissionGroups from "@/lib/swr/use-dataroom-permission-groups";
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
type LinkPermissions = Record<string, { view: boolean; download: boolean }>;

export function SetUnifiedPermissionsModal({
  open,
  setOpen,
  dataroomId,
  onComplete,
  uploadedFiles,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  dataroomId: string;
  onComplete?: () => void;
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

  // Computed values instead of useEffect + useState
  const { showFileList, defaultSelectedFile } = useMemo(() => {
    const shouldShowFileList = uploadedFiles.length > 1;
    const defaultFile = uploadedFiles.length === 1 ? uploadedFiles[0] : null;
    return {
      showFileList: shouldShowFileList,
      defaultSelectedFile: defaultFile,
    };
  }, [uploadedFiles]);

  const [showFileListState, setShowFileListState] = useState(showFileList);

  // Initialize selectedFile on mount or when uploadedFiles changes
  useEffect(() => {
    if (defaultSelectedFile && !selectedFile) {
      setSelectedFile(defaultSelectedFile);
      setShowFileListState(false);
    } else if (!defaultSelectedFile) {
      setShowFileListState(true);
    }
  }, [defaultSelectedFile, selectedFile]);

  const currentDocumentId = useMemo(() => {
    return selectedFile?.documentId || uploadedFiles[0]?.documentId;
  }, [selectedFile, uploadedFiles]);

  const currentDataroomDocumentId = useMemo(() => {
    return (
      selectedFile?.dataroomDocumentId || uploadedFiles[0]?.dataroomDocumentId
    );
  }, [selectedFile, uploadedFiles]);

  // Fetch viewer groups
  const {
    viewerGroups,
    loading: viewerGroupsLoading,
    mutate: mutateViewerGroups,
  } = useDataroomGroups({
    documentId: currentDataroomDocumentId,
  });

  // Fetch links and permission groups
  const { links, loading: linksLoading } = useDataroomLinks();
  const { permissionGroups, loading: permissionGroupsLoading } =
    useDataroomPermissionGroups();

  const [loading, setLoading] = useState(false);
  // Track permissions per file using dataroomDocumentId as key
  const [filePermissions, setFilePermissions] = useState<
    Record<
      string,
      {
        groupPermissions: GroupPermissions;
        linkPermissions: LinkPermissions;
      }
    >
  >({});
  // Track which files have been saved
  const [savedFiles, setSavedFiles] = useState<Set<string>>(new Set());

  // Current file permissions (derived from filePermissions)
  const selectedGroupPermissions = useMemo(() => {
    return currentDataroomDocumentId
      ? filePermissions[currentDataroomDocumentId]?.groupPermissions || {}
      : {};
  }, [filePermissions, currentDataroomDocumentId]);

  const selectedLinkPermissions = useMemo(() => {
    return currentDataroomDocumentId
      ? filePermissions[currentDataroomDocumentId]?.linkPermissions || {}
      : {};
  }, [filePermissions, currentDataroomDocumentId]);

  // Memoize links with permission groups to avoid recalculation
  const linksWithPermissionGroups = useMemo(() => {
    if (!links || !permissionGroups) return [];

    return links
      .filter(
        (link) =>
          link.permissionGroupId &&
          permissionGroups.some((pg) => pg.id === link.permissionGroupId),
      )
      .map((link) => ({
        ...link,
        permissionGroup: permissionGroups.find(
          (pg) => pg.id === link.permissionGroupId,
        ),
      }));
  }, [links, permissionGroups]);

  // Refetch viewer groups when selectedFile changes
  useEffect(() => {
    if (selectedFile) {
      mutateViewerGroups();
    }
  }, [selectedFile, mutateViewerGroups]);

  // Memoize initial group permissions instead of useEffect
  const initialGroupPermissions = useMemo(() => {
    if (!viewerGroups) return {};

    const permissions: GroupPermissions = {};
    viewerGroups.forEach((group) => {
      permissions[group.id] = {
        view: group.accessControls?.[0]?.canView ?? false,
        download: group.accessControls?.[0]?.canDownload ?? false,
      };
    });
    return permissions;
  }, [viewerGroups]);

  // Memoize initial link permissions instead of useEffect
  const initialLinkPermissions = useMemo(() => {
    if (!linksWithPermissionGroups || !currentDataroomDocumentId) return {};

    const permissions: LinkPermissions = {};
    linksWithPermissionGroups.forEach((link) => {
      const documentPermission = link.permissionGroup?.accessControls?.find(
        (ac) => ac.itemId === currentDataroomDocumentId,
      );
      permissions[link.id] = {
        view: documentPermission?.canView ?? false,
        download: documentPermission?.canDownload ?? false,
      };
    });
    return permissions;
  }, [linksWithPermissionGroups, currentDataroomDocumentId]);

  // Update state when initial permissions change
  useEffect(() => {
    if (currentDataroomDocumentId) {
      setFilePermissions((prev) => ({
        ...prev,
        [currentDataroomDocumentId]: {
          groupPermissions: initialGroupPermissions,
          linkPermissions:
            prev[currentDataroomDocumentId]?.linkPermissions || {},
        },
      }));
    }
  }, [initialGroupPermissions, currentDataroomDocumentId]);

  useEffect(() => {
    if (currentDataroomDocumentId) {
      setFilePermissions((prev) => ({
        ...prev,
        [currentDataroomDocumentId]: {
          groupPermissions:
            prev[currentDataroomDocumentId]?.groupPermissions || {},
          linkPermissions: initialLinkPermissions,
        },
      }));
    }
  }, [initialLinkPermissions, currentDataroomDocumentId]);

  // Memoize permission update handlers to avoid recreation
  const updateGroupPermissions = useCallback(
    (groupId: string, newPermissions: string[]) => {
      if (!currentDataroomDocumentId) return;

      const hasView = newPermissions.includes("view");
      const hasDownload = newPermissions.includes("download");

      const prevPermissions = selectedGroupPermissions[groupId] || {
        view: false,
        download: false,
      };

      let finalPermissions = newPermissions;

      if (
        hasDownload &&
        !hasView &&
        !prevPermissions.view &&
        !prevPermissions.download
      ) {
        finalPermissions = ["view", "download"];
      } else if (hasDownload && !hasView) {
        finalPermissions = [];
      }

      setFilePermissions((prev) => ({
        ...prev,
        [currentDataroomDocumentId]: {
          groupPermissions: {
            ...prev[currentDataroomDocumentId]?.groupPermissions,
            [groupId]: {
              view: finalPermissions.includes("view"),
              download: finalPermissions.includes("download"),
            },
          },
          linkPermissions:
            prev[currentDataroomDocumentId]?.linkPermissions || {},
        },
      }));
    },
    [selectedGroupPermissions, currentDataroomDocumentId],
  );

  const updateLinkPermissions = useCallback(
    (linkId: string, newPermissions: string[]) => {
      if (!currentDataroomDocumentId) return;

      const hasView = newPermissions.includes("view");
      const hasDownload = newPermissions.includes("download");

      const prevPermissions = selectedLinkPermissions[linkId] || {
        view: false,
        download: false,
      };

      let finalPermissions = newPermissions;

      if (
        hasDownload &&
        !hasView &&
        !prevPermissions.view &&
        !prevPermissions.download
      ) {
        finalPermissions = ["view", "download"];
      } else if (hasDownload && !hasView) {
        finalPermissions = [];
      }

      setFilePermissions((prev) => ({
        ...prev,
        [currentDataroomDocumentId]: {
          groupPermissions:
            prev[currentDataroomDocumentId]?.groupPermissions || {},
          linkPermissions: {
            ...prev[currentDataroomDocumentId]?.linkPermissions,
            [linkId]: {
              view: finalPermissions.includes("view"),
              download: finalPermissions.includes("download"),
            },
          },
        },
      }));
    },
    [selectedLinkPermissions, currentDataroomDocumentId],
  );

  // Memoize bulk actions to avoid recreation
  const enableViewForAll = useCallback(() => {
    if (!currentDataroomDocumentId) return;

    // Enable view for all viewer groups
    const newGroupPermissions = { ...selectedGroupPermissions };
    viewerGroups?.forEach((group) => {
      newGroupPermissions[group.id] = {
        ...newGroupPermissions[group.id],
        view: true,
      };
    });

    // Enable view for all links
    const newLinkPermissions = { ...selectedLinkPermissions };
    linksWithPermissionGroups?.forEach((link) => {
      newLinkPermissions[link.id] = {
        ...newLinkPermissions[link.id],
        view: true,
      };
    });

    setFilePermissions((prev) => ({
      ...prev,
      [currentDataroomDocumentId]: {
        groupPermissions: newGroupPermissions,
        linkPermissions: newLinkPermissions,
      },
    }));
  }, [
    selectedGroupPermissions,
    selectedLinkPermissions,
    viewerGroups,
    linksWithPermissionGroups,
    currentDataroomDocumentId,
  ]);

  const enableDownloadForAll = useCallback(() => {
    if (!currentDataroomDocumentId) return;

    // Enable view + download for all viewer groups
    const newGroupPermissions = { ...selectedGroupPermissions };
    viewerGroups?.forEach((group) => {
      newGroupPermissions[group.id] = {
        view: true,
        download: true,
      };
    });

    // Enable view + download for all links
    const newLinkPermissions = { ...selectedLinkPermissions };
    linksWithPermissionGroups?.forEach((link) => {
      newLinkPermissions[link.id] = {
        view: true,
        download: true,
      };
    });

    setFilePermissions((prev) => ({
      ...prev,
      [currentDataroomDocumentId]: {
        groupPermissions: newGroupPermissions,
        linkPermissions: newLinkPermissions,
      },
    }));
  }, [
    selectedGroupPermissions,
    selectedLinkPermissions,
    viewerGroups,
    linksWithPermissionGroups,
    currentDataroomDocumentId,
  ]);

  const handleFileSelect = useCallback((file: (typeof uploadedFiles)[0]) => {
    setSelectedFile(file);
    setShowFileListState(false);
  }, []);

  const handleBack = useCallback(() => {
    setShowFileListState(true);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setLoading(true);

      try {
        // Save viewer group permissions (only if changed and at least one permission is true)
        const viewerGroupPromises = Object.entries(selectedGroupPermissions)
          .filter(([groupId, permissions]) => {
            // Only process groups that have actual permissions set OR have changed
            const initialPermissions = initialGroupPermissions[groupId];
            const hasChanged =
              !initialPermissions ||
              initialPermissions.view !== permissions.view ||
              initialPermissions.download !== permissions.download;

            return hasChanged && (permissions.view || permissions.download);
          })
          .map(([groupId, permissions]) => {
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
          });

        // Filter out link permissions that haven't changed or are both false
        const linksNeedingUpdate = Object.entries(selectedLinkPermissions)
          .filter(([linkId, permissions]) => {
            // Only process links that have actual permissions set OR need to be removed
            const initialPermissions = initialLinkPermissions[linkId];
            const hasChanged =
              !initialPermissions ||
              initialPermissions.view !== permissions.view ||
              initialPermissions.download !== permissions.download;

            return hasChanged;
          })
          .map(([linkId, permissions]) => ({ linkId, permissions }));

        // Save link permissions (only fetch and update what's needed)
        const linkPromises = linksNeedingUpdate.map(
          async ({ linkId, permissions }) => {
            const link = linksWithPermissionGroups.find((l) => l.id === linkId);
            if (!link?.permissionGroupId) return Promise.resolve();

            // Fetch existing permissions for this permission group
            const existingPermissionsResponse = await fetch(
              `/api/teams/${teamId}/datarooms/${dataroomId}/permission-groups/${link.permissionGroupId}`,
            );

            if (!existingPermissionsResponse.ok) {
              throw new Error("Failed to fetch existing permissions");
            }

            const { permissionGroup } =
              await existingPermissionsResponse.json();

            // Build the complete permissions object by merging existing with new
            const allPermissions: Record<
              string,
              { view: boolean; download: boolean; itemType: ItemType }
            > = {};

            // Add all existing permissions
            permissionGroup.accessControls.forEach((control: any) => {
              allPermissions[control.itemId] = {
                view: control.canView,
                download: control.canDownload,
                itemType: control.itemType,
              };
            });

            // Only add/update the permission if at least one is true
            if (permissions.view || permissions.download) {
              allPermissions[currentDataroomDocumentId] = {
                itemType: ItemType.DATAROOM_DOCUMENT,
                view: permissions.view,
                download: permissions.download,
              };
            } else {
              // If both are false, remove the permission entirely
              delete allPermissions[currentDataroomDocumentId];
            }

            // Send the complete permissions set
            return fetch(
              `/api/teams/${teamId}/datarooms/${dataroomId}/permission-groups/${link.permissionGroupId}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  permissions: allPermissions,
                  linkId: linkId,
                }),
              },
            );
          },
        );

        await Promise.all([...viewerGroupPromises, ...linkPromises]);

        toast.success("Permissions updated successfully!");

        await Promise.all([
          mutateViewerGroups(),
          mutate(
            `/api/teams/${teamId}/datarooms/${dataroomId}/groups?documentId=${currentDocumentId}`,
          ),
          mutate(
            `/api/teams/${teamId}/datarooms/${dataroomId}/permission-groups`,
          ),
          mutate(`/api/teams/${teamId}/datarooms/${dataroomId}/links`),
        ]);

        // Mark current file as saved
        setSavedFiles((prev) => new Set([...prev, currentDataroomDocumentId]));

        if (uploadedFiles.length > 1) {
          // Find next unsaved file
          const nextUnsavedFile = uploadedFiles.find(
            (file) =>
              !savedFiles.has(file.dataroomDocumentId) &&
              file.dataroomDocumentId !== currentDataroomDocumentId,
          );

          if (nextUnsavedFile) {
            // Go to next unsaved file
            setSelectedFile(nextUnsavedFile);
            setShowFileListState(false);
          } else {
            // All files are saved, complete the flow
            onComplete?.();
            setOpen(false);
          }
        } else {
          onComplete?.();
          setOpen(false);
        }
      } catch (error) {
        console.error("Error updating permissions:", error);
        toast.error("Failed to update permissions");
      } finally {
        setLoading(false);
      }
    },
    [
      selectedGroupPermissions,
      selectedLinkPermissions,
      initialGroupPermissions,
      initialLinkPermissions,
      teamId,
      dataroomId,
      currentDataroomDocumentId,
      linksWithPermissionGroups,
      mutateViewerGroups,
      currentDocumentId,
      uploadedFiles,
      savedFiles,
      onComplete,
      setOpen,
    ],
  );

  // Memoize computed values for UI
  const isLoading = useMemo(
    () => viewerGroupsLoading || linksLoading || permissionGroupsLoading,
    [viewerGroupsLoading, linksLoading, permissionGroupsLoading],
  );

  const hasViewerGroups = useMemo(
    () => viewerGroups && viewerGroups.length > 0,
    [viewerGroups],
  );

  const hasLinks = useMemo(
    () => linksWithPermissionGroups && linksWithPermissionGroups.length > 0,
    [linksWithPermissionGroups],
  );

  const hasAnyPermissions = useMemo(
    () => hasViewerGroups || hasLinks,
    [hasViewerGroups, hasLinks],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="w-[90%]">
          <div className="flex items-center gap-2">
            {!showFileListState && uploadedFiles.length > 1 && (
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
              <DialogTitle>Set Permissions</DialogTitle>
              <DialogDescription>
                {showFileListState
                  ? savedFiles.size === uploadedFiles.length
                    ? "All files have been processed successfully!"
                    : "Select a file to set permissions"
                  : "Update permissions for the selected file"}
                {uploadedFiles.length > 1 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Progress: {savedFiles.size} of {uploadedFiles.length} files
                    completed
                  </div>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {showFileListState ? (
          <div className="space-y-2">
            {uploadedFiles.map((file) => {
              const isSaved = savedFiles.has(file.dataroomDocumentId);
              const isSelected = selectedFile?.documentId === file.documentId;

              return (
                <div
                  key={file.documentId}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-lg border p-3",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : isSaved
                        ? "border-green-200 bg-green-50"
                        : "hover:bg-muted/50",
                  )}
                  onClick={() => handleFileSelect(file)}
                >
                  <div className="flex items-center space-x-3">
                    <FileTextIcon className="h-5 w-5" />
                    <span>{file.fileName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isSaved && (
                      <div className="text-sm text-green-600">✓ Saved</div>
                    )}
                    {isSelected && (
                      <div className="text-sm text-primary">Selected</div>
                    )}
                  </div>
                </div>
              );
            })}
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

            {hasAnyPermissions && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={enableViewForAll}
                  className="flex items-center gap-2"
                >
                  <EyeIcon className="h-4 w-4" />
                  Enable View for All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={enableDownloadForAll}
                  className="flex items-center gap-2"
                >
                  <ArrowDownToLineIcon className="h-4 w-4" />
                  Enable Download for All
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="rounded-md border">
                <div className="max-h-[400px] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : !hasAnyPermissions ? (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">
                        No groups or links found. Create groups or links to set
                        permissions.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-secondary">
                        <TableRow>
                          <TableHead className="w-[60%]">Name</TableHead>
                          <TableHead className="w-[20%] text-center">
                            View
                          </TableHead>
                          <TableHead className="w-[20%] text-center">
                            Download
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="relative">
                        {hasViewerGroups && (
                          <>
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="bg-muted/50 font-medium"
                              >
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Viewer Groups
                                </div>
                              </TableCell>
                            </TableRow>
                            {viewerGroups?.map((group) => (
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
                                      selectedGroupPermissions[group.id] || {},
                                    )
                                      .filter(
                                        ([key, value]) =>
                                          key === "view" && value,
                                      )
                                      .map(([key, _]) => key)}
                                    onValueChange={(value) => {
                                      const currentPermissions = Object.entries(
                                        selectedGroupPermissions[group.id] ||
                                          {},
                                      )
                                        .filter(([_, val]) => val)
                                        .map(([key, _]) => key);

                                      if (
                                        currentPermissions.includes("view") &&
                                        !value.includes("view")
                                      ) {
                                        const newPerms =
                                          currentPermissions.filter(
                                            (p) =>
                                              p !== "view" && p !== "download",
                                          );
                                        updateGroupPermissions(
                                          group.id,
                                          newPerms,
                                        );
                                      } else if (
                                        !currentPermissions.includes("view") &&
                                        value.includes("view")
                                      ) {
                                        const newPerms = [
                                          ...currentPermissions,
                                          "view",
                                        ];
                                        updateGroupPermissions(
                                          group.id,
                                          newPerms,
                                        );
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
                                        selectedGroupPermissions[group.id]?.view
                                          ? "data-[state=on]:bg-foreground data-[state=on]:text-background"
                                          : "",
                                      )}
                                    >
                                      {selectedGroupPermissions[group.id]
                                        ?.view ? (
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
                                      selectedGroupPermissions[group.id] || {},
                                    )
                                      .filter(
                                        ([key, value]) =>
                                          key === "download" && value,
                                      )
                                      .map(([key, _]) => key)}
                                    onValueChange={(value) => {
                                      const currentPermissions = Object.entries(
                                        selectedGroupPermissions[group.id] ||
                                          {},
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
                                        updateGroupPermissions(
                                          group.id,
                                          newPerms,
                                        );
                                      } else {
                                        const newPerms =
                                          currentPermissions.filter(
                                            (p) => p !== "download",
                                          );
                                        if (value.includes("download")) {
                                          newPerms.push("download");
                                        }
                                        updateGroupPermissions(
                                          group.id,
                                          newPerms,
                                        );
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
                                        selectedGroupPermissions[group.id]
                                          ?.download
                                          ? "data-[state=on]:bg-foreground data-[state=on]:text-background"
                                          : "",
                                      )}
                                    >
                                      {selectedGroupPermissions[group.id]
                                        ?.download ? (
                                        <ArrowDownToLineIcon className="h-5 w-5" />
                                      ) : (
                                        <CloudDownloadOff className="h-5 w-5" />
                                      )}
                                    </ToggleGroupItem>
                                  </ToggleGroup>
                                </TableCell>
                              </TableRow>
                            ))}
                          </>
                        )}

                        {hasLinks && (
                          <>
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="bg-muted/50 font-medium"
                              >
                                <div className="flex items-center gap-2">
                                  <LinkIcon className="h-4 w-4" />
                                  Links
                                </div>
                              </TableCell>
                            </TableRow>
                            {linksWithPermissionGroups?.map((link) => (
                              <TableRow key={link.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">
                                      {link.name ||
                                        `Link #${link.id.slice(-5)}`}
                                    </p>
                                    <p className="max-w-[300px] truncate text-sm text-muted-foreground">
                                      {link.domainId && link.slug
                                        ? `${link.domainSlug}/${link.slug}`
                                        : `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${link.id}`}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <ToggleGroup
                                    type="multiple"
                                    value={Object.entries(
                                      selectedLinkPermissions[link.id] || {},
                                    )
                                      .filter(
                                        ([key, value]) =>
                                          key === "view" && value,
                                      )
                                      .map(([key, _]) => key)}
                                    onValueChange={(value) => {
                                      const currentPermissions = Object.entries(
                                        selectedLinkPermissions[link.id] || {},
                                      )
                                        .filter(([_, val]) => val)
                                        .map(([key, _]) => key);

                                      if (
                                        currentPermissions.includes("view") &&
                                        !value.includes("view")
                                      ) {
                                        const newPerms =
                                          currentPermissions.filter(
                                            (p) =>
                                              p !== "view" && p !== "download",
                                          );
                                        updateLinkPermissions(
                                          link.id,
                                          newPerms,
                                        );
                                      } else if (
                                        !currentPermissions.includes("view") &&
                                        value.includes("view")
                                      ) {
                                        const newPerms = [
                                          ...currentPermissions,
                                          "view",
                                        ];
                                        updateLinkPermissions(
                                          link.id,
                                          newPerms,
                                        );
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
                                        selectedLinkPermissions[link.id]?.view
                                          ? "data-[state=on]:bg-foreground data-[state=on]:text-background"
                                          : "",
                                      )}
                                    >
                                      {selectedLinkPermissions[link.id]
                                        ?.view ? (
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
                                      selectedLinkPermissions[link.id] || {},
                                    )
                                      .filter(
                                        ([key, value]) =>
                                          key === "download" && value,
                                      )
                                      .map(([key, _]) => key)}
                                    onValueChange={(value) => {
                                      const currentPermissions = Object.entries(
                                        selectedLinkPermissions[link.id] || {},
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
                                        updateLinkPermissions(
                                          link.id,
                                          newPerms,
                                        );
                                      } else {
                                        const newPerms =
                                          currentPermissions.filter(
                                            (p) => p !== "download",
                                          );
                                        if (value.includes("download")) {
                                          newPerms.push("download");
                                        }
                                        updateLinkPermissions(
                                          link.id,
                                          newPerms,
                                        );
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
                                        selectedLinkPermissions[link.id]
                                          ?.download
                                          ? "data-[state=on]:bg-foreground data-[state=on]:text-background"
                                          : "",
                                      )}
                                    >
                                      {selectedLinkPermissions[link.id]
                                        ?.download ? (
                                        <ArrowDownToLineIcon className="h-5 w-5" />
                                      ) : (
                                        <CloudDownloadOff className="h-5 w-5" />
                                      )}
                                    </ToggleGroupItem>
                                  </ToggleGroup>
                                </TableCell>
                              </TableRow>
                            ))}
                          </>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="submit"
                  loading={loading}
                  disabled={!hasAnyPermissions}
                >
                  {uploadedFiles.length > 1
                    ? (() => {
                        const remainingFiles = uploadedFiles.filter(
                          (file) =>
                            !savedFiles.has(file.dataroomDocumentId) &&
                            file.dataroomDocumentId !==
                              currentDataroomDocumentId,
                        );
                        return remainingFiles.length > 0
                          ? "Save & Next"
                          : "Save & Complete";
                      })()
                    : "Save permissions"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
