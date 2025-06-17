import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import useSWR from "swr";

import useDataroomGroups from "@/lib/swr/use-dataroom-groups";
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

type DefaultGroupPermissionStrategy =
  | "ask_every_time"
  | "inherit_from_parent"
  | "use_default_permissions"
  | "no_permissions";

interface PermissionSettingsProps {
  dataroomId: string;
}

export default function PermissionSettings({
  dataroomId,
}: PermissionSettingsProps) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const { viewerGroups, mutate: mutateGroups } = useDataroomGroups();

  const { data: dataroomData, mutate: mutateDataroom } = useSWR<{
    id: string;
    name: string;
    pId: string;
    defaultGroupPermission: DefaultGroupPermissionStrategy;
  }>(
    teamId && dataroomId
      ? `/api/teams/${teamId}/datarooms/${dataroomId}`
      : null,
    fetcher,
  );

  const [isUpdating, setIsUpdating] = useState(false);

  const handlePermissionChange = async (
    value: DefaultGroupPermissionStrategy,
  ) => {
    if (!dataroomId || !teamId || isUpdating || !dataroomData) return;
    setIsUpdating(true);

    const optimisticData = { ...dataroomData, defaultGroupPermission: value };

    const mutation = async () => {
      const res = await fetch(`/api/teams/${teamId}/datarooms/${dataroomId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          defaultGroupPermission: value,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update permission settings");
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
          loading: "Updating permission settings...",
          success: "Permission settings updated successfully",
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
      fetch(`/api/teams/${teamId}/datarooms/${dataroomId}/groups/${groupId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(permissions),
      }).then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to update group permissions");
        }
        await mutateGroups();
      }),
      {
        loading: "Updating group permissions...",
        success: "Group permissions updated successfully",
        error: "Failed to update group permissions",
      },
    );
  };

  const handleViewPermissionChange = async (
    groupId: string,
    checked: boolean,
  ) => {
    const group = viewerGroups?.find((g) => g.id === groupId);
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
    const group = viewerGroups?.find((g) => g.id === groupId);
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
    dataroomData?.defaultGroupPermission ?? "ask_every_time";
  const showGroupSettings = currentStrategy === "use_default_permissions";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Settings</CardTitle>
        <CardDescription>
          Configure how group permissions are handled for new documents.
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
            <RadioGroupItem value="ask_every_time" id="ask_every_time" />
            <div>
              <Label htmlFor="ask_every_time" className="text-sm font-medium">
                Ask every time
              </Label>
              <p className="text-xs text-muted-foreground">
                Show permissions modal for each upload
              </p>
            </div>
          </div>

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
                New documents inherit permissions from their parent folder.
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
                  Use default group permissions
                </Label>
                <p className="text-xs text-muted-foreground">
                  Apply configured group defaults automatically
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
                    {viewerGroups === undefined ? (
                      <div className="rounded-lg border bg-muted/20 p-6 text-center">
                        <p className="text-xs text-muted-foreground">
                          Loading groups...
                        </p>
                      </div>
                    ) : viewerGroups.length > 0 ? (
                      <div className="rounded-lg border bg-muted/30">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b">
                              <TableHead className="h-9 w-[60%] text-xs font-medium">
                                Group
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
                            {viewerGroups.map((group) => (
                              <TableRow
                                key={group.id}
                                className="border-b last:border-b-0"
                              >
                                <TableCell className="py-2 text-sm">
                                  {group.name}
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
                                    checked={group.defaultCanDownload ?? false}
                                    onCheckedChange={(checked) =>
                                      handleDownloadPermissionChange(
                                        group.id,
                                        checked,
                                      )
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center">
                        <p className="text-xs text-muted-foreground">
                          No groups found. Create groups to configure
                          permissions.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center space-x-3">
            <RadioGroupItem value="no_permissions" id="no_permissions" />
            <div>
              <Label htmlFor="no_permissions" className="text-sm font-medium">
                No permissions by default
              </Label>
              <p className="text-xs text-muted-foreground">
                No group permissions applied automatically. Permissions modal
                will not open.
              </p>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}