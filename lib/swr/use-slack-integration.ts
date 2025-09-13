import { useTeam } from "@/context/team-context";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";

import { SlackIntegration } from "@/lib/integrations/slack/types";
import { fetcher } from "@/lib/utils";

export function useSlackIntegration({ enabled = true }: { enabled?: boolean }) {
  const { currentTeamId: teamId } = useTeam();
  const { data, error, isLoading, mutate } = useSWRImmutable<SlackIntegration>(
    enabled && teamId ? `/api/teams/${teamId}/integrations/slack` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000,
      revalidateIfStale: false,
      errorRetryCount: 2,
      errorRetryInterval: 5000,
    },
  );

  return {
    integration: data || null,
    error,
    loading: isLoading && !data,
    mutate,
  };
}
