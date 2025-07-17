import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import useSWR from "swr";

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

type DefaultPermissionStrategy =
  | "INHERIT_FROM_PARENT"
  | "ASK_EVERY_TIME"
  | "HIDDEN_BY_DEFAULT";

interface PermissionSettingsProps {
  dataroomId: string;
}

export default function PermissionSettings({
  dataroomId,
}: PermissionSettingsProps) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: dataroomData, mutate: mutateDataroom } = useSWR<{
    id: string;
    name: string;
    pId: string;
    defaultPermissionStrategy: DefaultPermissionStrategy;
  }>(
    teamId && dataroomId
      ? `/api/teams/${teamId}/datarooms/${dataroomId}`
      : null,
    fetcher,
  );

  const [isUpdating, setIsUpdating] = useState(false);

  const handlePermissionChange = async (value: DefaultPermissionStrategy) => {
    if (!dataroomId || !teamId || isUpdating || !dataroomData) return;
    setIsUpdating(true);

    const optimisticData = {
      ...dataroomData,
      defaultPermissionStrategy: value,
    };

    const mutation = async () => {
      const res = await fetch(`/api/teams/${teamId}/datarooms/${dataroomId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          defaultPermissionStrategy: value,
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

  const currentStrategy =
    dataroomData?.defaultPermissionStrategy ?? "HIDDEN_BY_DEFAULT";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default File Permissions</CardTitle>
        <CardDescription>
          Configure how permissions are handled for new documents and folders
          added to this dataroom.
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
            <RadioGroupItem value="INHERIT_FROM_PARENT" id="inherit" />
            <div>
              <Label htmlFor="inherit" className="text-sm font-medium">
                Inherit from parent folder
              </Label>
              <p className="text-xs text-muted-foreground">
                New documents and folders automatically inherit permissions from
                their parent folder. Root-level items get view-only permissions
                by default.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <RadioGroupItem value="ASK_EVERY_TIME" id="ask" />
            <div>
              <Label htmlFor="ask" className="text-sm font-medium">
                Ask every time
              </Label>
              <p className="text-xs text-muted-foreground">
                Show permissions modal for each document upload to manually
                configure permissions.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <RadioGroupItem value="HIDDEN_BY_DEFAULT" id="hidden" />
            <div>
              <Label htmlFor="hidden" className="text-sm font-medium">
                Hidden by default
              </Label>
              <p className="text-xs text-muted-foreground">
                New documents and folders are hidden by default. Permissions
                must be configured manually.
              </p>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
