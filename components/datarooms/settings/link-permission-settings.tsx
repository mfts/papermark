import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import useSWR from "swr";

import useDataroomPermissionGroups from "@/lib/swr/use-dataroom-permission-groups";
import { fetcher } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DefaultLinkPermissionStrategy =
  | "inherit_from_parent"
  | "use_default_permissions"
  | "use_simple_permissions";

interface LinkPermissionSettingsProps {
  dataroomId: string;
}

export default function LinkPermissionSettings({
  dataroomId,
}: LinkPermissionSettingsProps) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const { permissionGroups, mutate: mutateGroups } =
    useDataroomPermissionGroups();

  const { data: dataroomData, mutate: mutateDataroom } = useSWR<{
    id: string;
    name: string;
    pId: string;
    defaultLinkPermission: DefaultLinkPermissionStrategy;
    defaultLinkCanView: boolean;
    defaultLinkCanDownload: boolean;
  }>(
    teamId && dataroomId
      ? `/api/teams/${teamId}/datarooms/${dataroomId}`
      : null,
    fetcher,
  );

  const [isUpdating, setIsUpdating] = useState(false);

  const handlePermissionChange = async (
    value: DefaultLinkPermissionStrategy,
  ) => {
    if (!dataroomId || !teamId || isUpdating || !dataroomData) return;
    setIsUpdating(true);

    const optimisticData = { ...dataroomData, defaultLinkPermission: value };

    const mutation = async () => {
      const res = await fetch(`/api/teams/${teamId}/datarooms/${dataroomId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          defaultLinkPermission: value,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update link permission settings");
      }

      return res.json();
    };

    try {
      await toast.promise(
        mutateDataroom(mutation(), {
          optimisticData,
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        }),
        {
          loading: "Updating link permission settings...",
          success: "Link permission settings updated successfully",
          error: (err) => err.message,
        },
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSimplePermissionChange = async (
    field: "defaultLinkCanView" | "defaultLinkCanDownload",
    checked: boolean,
  ) => {
    if (!dataroomId || !teamId || isUpdating || !dataroomData) return;
    setIsUpdating(true);

    let updateData: Record<string, boolean> = { [field]: checked };

    if (
      field === "defaultLinkCanDownload" &&
      checked &&
      !dataroomData.defaultLinkCanView
    ) {
      // Enabling download but view is disabled - auto enable view
      updateData.defaultLinkCanView = true;
    } else if (
      field === "defaultLinkCanView" &&
      !checked &&
      dataroomData.defaultLinkCanDownload
    ) {
      // Disabling view but download is enabled - auto disable download
      updateData.defaultLinkCanDownload = false;
    }

    const optimisticData = { ...dataroomData, ...updateData };

    const mutation = async () => {
      const res = await fetch(`/api/teams/${teamId}/datarooms/${dataroomId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        throw new Error("Failed to update simple permission settings");
      }

      return res.json();
    };

    try {
      await toast.promise(
        mutateDataroom(mutation(), {
          optimisticData,
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        }),
        {
          loading: "Updating simple permission settings...",
          success: "Simple permission settings updated successfully",
          error: (err) => err.message,
        },
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateGroupPermissions = async (
    groupId: string,
    permissions: {
      defaultCanView?: boolean;
      defaultCanDownload?: boolean;
    },
  ) => {
    if (!teamId) return;

    toast.promise(
      fetch(
        `/api/teams/${teamId}/datarooms/${dataroomId}/permission-groups/${groupId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(permissions),
        },
      ).then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to update permission group permissions");
        }
        await mutateGroups();
      }),
      {
        loading: "Updating permission group permissions...",
        success: "Permission group permissions updated successfully",
        error: "Failed to update permission group permissions",
      },
    );
  };

  const handleViewPermissionChange = async (
    groupId: string,
    checked: boolean,
  ) => {
    const group = permissionGroups?.find((g) => g.id === groupId);
    if (!group) return;

    // If disabling view, also disable download in single API call
    if (!checked && (group.defaultCanDownload ?? false)) {
      await updateGroupPermissions(groupId, {
        defaultCanView: checked,
        defaultCanDownload: false,
      });
    } else {
      await updateGroupPermissions(groupId, {
        defaultCanView: checked,
      });
    }
  };

  const handleDownloadPermissionChange = async (
    groupId: string,
    checked: boolean,
  ) => {
    const group = permissionGroups?.find((g) => g.id === groupId);
    if (!group) return;

    // If enabling download, also enable view in single API call
    if (checked && !(group.defaultCanView ?? false)) {
      await updateGroupPermissions(groupId, {
        defaultCanView: true,
        defaultCanDownload: checked,
      });
    } else {
      await updateGroupPermissions(groupId, {
        defaultCanDownload: checked,
      });
    }
  };

  const currentStrategy =
    dataroomData?.defaultLinkPermission ?? "inherit_from_parent";
  const showGroupSettings = currentStrategy === "use_default_permissions";
  const showSimpleSettings = currentStrategy === "use_simple_permissions";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Link Default Permissions</CardTitle>
        <CardDescription>
          Configure how permissions are applied when adding new documents and
          folders to this dataroom.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={currentStrategy}
          onValueChange={handlePermissionChange}
          disabled={isUpdating || !dataroomData}
          className="space-y-3"
        >
          <div className="flex items-center space-x-3">
            <RadioGroupItem
              value="inherit_from_parent"
              id="inherit_from_parent"
            />
            <div>
              <Label
                htmlFor="inherit_from_parent"
                className="text-sm font-medium"
              >
                Inherit from parent folder
              </Label>
              <p className="text-xs text-muted-foreground">
                New documents and folders will automatically inherit the same
                permissions as their parent folder. If added to the root level,
                they will be view-only by default.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <RadioGroupItem
                value="use_default_permissions"
                id="use_default_permissions"
              />
              <div>
                <Label
                  htmlFor="use_default_permissions"
                  className="text-sm font-medium"
                >
                  Use default link permissions
                </Label>
                <p className="text-xs text-muted-foreground">
                  When you add new documents or folders, all existing links will
                  automatically get the permissions you configure below. This
                  ensures consistent access across your dataroom.
                </p>
              </div>
            </div>

            <AnimatePresence>
              {showGroupSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="ml-6 overflow-hidden"
                >
                  <div className="space-y-2">
                    {permissionGroups === undefined ? (
                      <div className="rounded-lg border bg-muted/20 p-6 text-center">
                        <p className="text-xs text-muted-foreground">
                          Loading permission groups...
                        </p>
                      </div>
                    ) : permissionGroups.length > 0 ? (
                      <div className="rounded-lg border bg-muted/30">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b">
                              <TableHead className="h-9 w-[60%] text-xs font-medium">
                                Link Name
                              </TableHead>
                              <TableHead className="h-9 w-[20%] text-center text-xs font-medium">
                                Can View
                              </TableHead>
                              <TableHead className="h-9 w-[20%] text-center text-xs font-medium">
                                Can Download
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {permissionGroups.map((group) => {
                              // Get the link name - usually there's one link per permission group
                              const linkName =
                                group.links?.[0]?.name ||
                                (group.links?.[0]?.id
                                  ? `Link #${group.links[0].id.slice(-5)}`
                                  : null);

                              return (
                                <TableRow
                                  key={group.id}
                                  className="border-b last:border-b-0"
                                >
                                  <TableCell className="py-2 text-sm">
                                    {linkName || group.name}
                                    {group.links && group.links.length > 1 && (
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        (+{group.links.length - 1} more)
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="py-2 text-center">
                                    <Switch
                                      checked={group.defaultCanView ?? false}
                                      onCheckedChange={(checked) =>
                                        handleViewPermissionChange(
                                          group.id,
                                          checked,
                                        )
                                      }
                                    />
                                  </TableCell>
                                  <TableCell className="py-2 text-center">
                                    <Switch
                                      checked={
                                        group.defaultCanDownload ?? false
                                      }
                                      onCheckedChange={(checked) =>
                                        handleDownloadPermissionChange(
                                          group.id,
                                          checked,
                                        )
                                      }
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center">
                        <p className="text-xs text-muted-foreground">
                          No links found. Create links to configure permissions
                          for your dataroom.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <RadioGroupItem
                value="use_simple_permissions"
                id="use_simple_permissions"
              />
              <div>
                <Label
                  htmlFor="use_simple_permissions"
                  className="text-sm font-medium"
                >
                  Use simple default permissions
                </Label>
                <p className="text-xs text-muted-foreground">
                  Apply the same view and download permissions to all new
                  documents and folders in this dataroom, regardless of where
                  they're added. This gives you full control over access levels
                  within this dataroom.
                </p>
              </div>
            </div>

            <AnimatePresence>
              {showSimpleSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="ml-6 overflow-hidden"
                >
                  <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Can View</Label>
                      </div>
                      <Switch
                        checked={dataroomData?.defaultLinkCanView ?? false}
                        onCheckedChange={(checked) =>
                          handleSimplePermissionChange(
                            "defaultLinkCanView",
                            checked,
                          )
                        }
                        disabled={isUpdating}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">
                          Can Download
                        </Label>
                      </div>
                      <Switch
                        checked={dataroomData?.defaultLinkCanDownload ?? false}
                        onCheckedChange={(checked) =>
                          handleSimplePermissionChange(
                            "defaultLinkCanDownload",
                            checked,
                          )
                        }
                        disabled={isUpdating}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
