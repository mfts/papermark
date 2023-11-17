import { Event } from "@prisma/client";
import useSWR from "swr";
import { fetcher } from "../utils";
import { Notifications } from "@/lib/types";

export default function useNotifications() {
  const { data: notifications, isValidating } = useSWR<Notifications[]>(
    "/api/notifications",
    fetcher,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  return {
    notifications,
    loading: notifications ? false : true,
    isValidating,
  };
}
