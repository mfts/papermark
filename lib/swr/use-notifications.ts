import { Event } from "@prisma/client";
import useSWR from "swr";
import { fetcher } from "../utils";
import { Notifications } from "@/lib/types";
import { useTeam } from "@/context/team-context";

export default function useNotifications() {
  const teamInfo = useTeam();

  const { data: notifications, isValidating } = useSWR<Notifications[]>(
    `/api/teams/${teamInfo?.currentTeam?.id}/notifications`,
    fetcher,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: true,
    },
  );

  return {
    notifications,
    loading: notifications ? false : true,
    isValidating,
  };
}
