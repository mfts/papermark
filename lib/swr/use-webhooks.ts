import { Webhook } from "@prisma/client";
import useSWR from "swr";
import { fetcher } from "../utils";
import { useTeam } from "@/context/team-context";

export default function useWebhooks() {
  const teamInfo = useTeam();

  const { data: webhooks, isValidating } = useSWR<Webhook[]>(
    `/api/teams/${teamInfo?.currentTeam?.id}/webhooks`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
  );

  return {
    webhooks,
    loading: webhooks ? false : true,
    isValidating,
  };
}
