import { useTeam } from "@/context/team-context";
import { View } from "@prisma/client";
import useSWR from "swr";

import { TStatsData } from "@/lib/swr/use-stats";
import { fetcher } from "@/lib/utils";

export function useDocumentStats(documentId: string | null | undefined) {
  const { currentTeamId: teamId } = useTeam();

  const { data: stats, error } = useSWR<TStatsData>(
    documentId && teamId
      ? `/api/teams/${teamId}/documents/${encodeURIComponent(documentId)}/stats`
      : null,
    fetcher,
    {
      dedupingInterval: 10000,
    },
  );

  return {
    stats,
    loading: documentId ? !error && !stats : false,
    error,
  };
}
