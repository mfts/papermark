import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Notifications } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { mutate } from "swr";
import { useRouter } from "next/router";
import { timeAgo } from "@/lib/utils";
import { useTeam } from "@/context/team-context";
import { Notification } from "@prisma/client";

export default function NotificationDropdown({
  children,
  notifications,
}: {
  children: React.ReactNode;
  notifications: Notifications[];
}) {
  const router = useRouter();
  const teamInfo = useTeam();

  const markNotificationRead = async (
    notificationId: string,
    documentId: string,
  ) => {
    const response = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/notifications/${notificationId}/mark-read`,
      {
        method: "POST",
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const notification = (await response.json()) as Notification;
    console.log(notification);
    if (notification.event === "DOCUMENT_DELETED") return;

    if (documentId) {
      router.push(`/documents/${documentId}`);
    }

    mutate(`/api/teams/${teamInfo?.currentTeam?.id}/notifications`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 max-h-96 divide-y overflow-y-scroll no-scrollbar">
        <DropdownMenuLabel>My Notifications</DropdownMenuLabel>
        {notifications.length === 0 ? (
          <div className="py-6 h-5/6 flex flex-col gap-3 items-center justify-center">
            <Bell className="h-6 w-6" />
            <p className="select-none">No Notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              className="relative py-4 pr-4 flex gap-3 hover:cursor-pointer"
              onClick={() =>
                markNotificationRead(notification.id, notification?.documentId)
              }
            >
              {notification.message}
              {!notification.isRead && (
                <Badge className="absolute top-[45%] right-1 p-1 bg-green-500"></Badge>
              )}
              <span className="absolute bottom-0.5 right-0.5 text-xs text-foreground">
                {timeAgo(notification.createdAt)}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
