import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { ItemType } from "@prisma/client";
import {
  ArrowDownToLineIcon,
  EyeIcon,
  EyeOffIcon,
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
  documentId,
  dataroomDocumentId,
  onComplete,
  fileName,
  isAutoOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  dataroomId: string;
  documentId: string;
  dataroomDocumentId: string;
  onComplete?: () => void;
  fileName: string;
  isAutoOpen?: boolean;
}) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const { viewerGroups, loading: viewerGroupsLoading } = useDataroomGroups({
    documentId,
  });
  const [loading, setLoading] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<GroupPermissions>({});

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
                  [dataroomDocumentId]: {
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
      onComplete?.();
      setOpen(false);
      mutate(
        `/api/teams/${teamId}/datarooms/${dataroomId}/groups?documentId=${documentId}`,
      );
    } catch (error) {
      console.error("Error updating group permissions:", error);
      toast.error("Failed to update group permissions");
    } finally {
      setLoading(false);
    }
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

  if (isAutoOpen && !viewerGroups) {
    onComplete?.();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="w-[90%]">
          <DialogTitle>Set Group Permissions for "{fileName}"</DialogTitle>
          <DialogDescription>
            Choose which groups can access this document and their permissions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="rounded-md border">
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-secondary">
                  <TableRow>
                    <TableHead className="w-[60%]">Group</TableHead>
                    <TableHead className="w-[20%] text-center">View</TableHead>
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
                              .filter(([key, value]) => key === "view" && value)
                              .map(([key, _]) => key)}
                            onValueChange={(value) => {
                              const currentPermissions = Object.entries(
                                selectedGroups[group.id] || {},
                              )
                                .filter(([_, val]) => val)
                                .map(([key, _]) => key);

                              // Remove view if it's in the current permissions but not in the new value
                              if (
                                currentPermissions.includes("view") &&
                                !value.includes("view")
                              ) {
                                const newPerms = currentPermissions.filter(
                                  (p) => p !== "view" && p !== "download",
                                );
                                updatePermissions(group.id, newPerms);
                              } else {
                                // Add view if it's not in the current permissions but in the new value
                                if (
                                  !currentPermissions.includes("view") &&
                                  value.includes("view")
                                ) {
                                  const newPerms = [
                                    ...currentPermissions,
                                    "view",
                                  ];
                                  updatePermissions(group.id, newPerms);
                                }
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
                                ([key, value]) => key === "download" && value,
                              )
                              .map(([key, _]) => key)}
                            onValueChange={(value) => {
                              const currentPermissions = Object.entries(
                                selectedGroups[group.id] || {},
                              )
                                .filter(([_, val]) => val)
                                .map(([key, _]) => key);

                              // If trying to add download, ensure view is also added
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
                                // Otherwise just update with the new value
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
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="w-full text-center">
                        No groups found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="submit" loading={loading}>
              Save permissions
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
