import { useTeam } from "@/context/team-context";
import useSWRImmutable from "swr/immutable";

import { fetcher } from "@/lib/utils";

interface SurveyStatus {
  dealType: string | null;
  dealSize: string | null;
  dismissed: boolean;
}

export function useSurveyStatus({ enabled = true }: { enabled?: boolean }) {
  const { currentTeamId: teamId } = useTeam();
  const { data, error, isLoading } = useSWRImmutable<SurveyStatus>(
    enabled && teamId ? `/api/teams/${teamId}/survey` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      errorRetryCount: 1,
    },
  );

  const isComplete =
    data?.dismissed ||
    (data?.dealType &&
      (data.dealType === "project-management" || data?.dealSize));

  return {
    surveyData: data || null,
    isComplete: !!isComplete,
    error,
    loading: isLoading && !data,
  };
}
