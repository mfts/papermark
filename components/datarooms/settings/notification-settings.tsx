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
import { Switch } from "@/components/ui/switch";

interface NotificationSettingsProps {
  dataroomId: string;
}

export default function NotificationSettings({
  dataroomId,
}: NotificationSettingsProps) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: features } = useSWR<{ roomChangeNotifications: boolean }>(
    teamInfo?.currentTeam?.id
      ? `/api/feature-flags?teamId=${teamInfo.currentTeam.id}`
      : null,
    fetcher,
  );

  const { data: dataroomData, mutate: mutateDataroom } = useSWR<{
    id: string;
    name: string;
    pId: string;
    notifyOnNewDocument: boolean;
  }>(
    dataroomId ? `/api/teams/${teamId}/datarooms/${dataroomId}` : null,
    fetcher,
  );

  const handleNotificationToggle = async (checked: boolean) => {
    if (!dataroomId || !teamId) return;

    toast.promise(
      fetch(`/api/teams/${teamId}/datarooms/${dataroomId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notifyOnNewDocument: checked,
        }),
      }).then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to update notification settings");
        }
        await mutateDataroom();
      }),
      {
        loading: "Updating notification settings...",
        success: "Notification settings updated successfully",
        error: "Failed to update notification settings",
      },
    );
  };

  if (!features?.roomChangeNotifications) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Configure notification settings for this dataroom.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <Switch
            id="notify-on-new-document"
            checked={dataroomData?.notifyOnNewDocument ?? true}
            onCheckedChange={handleNotificationToggle}
          />
          <Label htmlFor="notify-on-new-document">
            Notify verified visitors when new documents are added
          </Label>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          When enabled, verified visitors will receive an email notification
          when new documents are added to this dataroom.
        </p>
      </CardContent>
    </Card>
  );
}
