import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import useSWR from "swr";

import { TStatsData } from "@/lib/swr/use-stats";
import { fetcher } from "@/lib/utils";

type TDataroomDocumentStats = TStatsData & {
  totalPagesMax: number;
};

export function useDataroomDocumentStats(
  documentId: string | null | undefined,
) {
  const { currentTeamId: teamId } = useTeam();
  const router = useRouter();
  const { id: dataroomId } = router.query as { id: string };

  const { data: stats, error } = useSWR<TDataroomDocumentStats>(
    documentId && teamId && dataroomId
      ? `/api/teams/${teamId}/datarooms/${dataroomId}/documents/${encodeURIComponent(documentId)}/stats`
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
