import useSWR from "swr";
import { fetcher } from "../utils";
import { NotificationType } from "@prisma/client";

export interface INotifications {
  id: string;
  userId: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
}

export default function useNotifications() {
  const { data: notifications, error } = useSWR<INotifications>(
    "/api/notifications",
    fetcher,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
    }
  );

  return {
    notifications,
    error,
    loading: notifications ? false : true,
  };
}
