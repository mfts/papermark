import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Notifications } from "@/lib/types";
import Folder from "@/components/shared/icons/folder";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { mutate } from "swr";
import { useRouter } from "next/router";
import { timeAgo } from "@/lib/utils";

export default function NotificationDropdown({
  children,
  notifications,
}: {
  children: React.ReactNode;
  notifications: Notifications[];
}) {
  const router = useRouter();

  const markNotificationRead = async (
    notificationId: string,
    documentId: string
  ) => {
    const response = await fetch(
      `/api/notifications/${notificationId}/mark-read`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    router.push(`/documents/${documentId}`);

    mutate("/api/notifications");
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
                markNotificationRead(notification.id, notification.documentId)
              }>
              {notification.message}
              {!notification.isRead && (
                <Badge className="absolute top-[45%] right-1 p-1 bg-green-500"></Badge>
              )}
              <span className="absolute bottom-2 right-2 text-xs text-foreground">
                {timeAgo(notification.createdAt)}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
