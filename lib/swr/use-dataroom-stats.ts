import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import { View } from "@prisma/client";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export type TDataroomStatsData = {
  dataroomViews: View[];
  documentViews: View[];
  duration: {
    viewId: string;
    sum_duration: number;
  }[];
  total_duration: number;
};

export function useDataroomStats({
  excludeTeamMembers,
}: { excludeTeamMembers?: boolean } = {}) {
  // this gets the data for a document's graph of all views
  const router = useRouter();
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { id } = router.query as {
    id: string;
  };

  const { data: stats, error } = useSWR<TDataroomStatsData>(
    id &&
      teamId &&
      `/api/teams/${teamId}/datarooms/${id}/stats${excludeTeamMembers ? "?excludeTeamMembers=true" : ""}`,
    fetcher,
    {
      dedupingInterval: 10000,
    },
  );

  return {
    stats,
    loading: !error && !stats,
    error,
  };
}

// interface StatsViewData {
//   views: View[];
//   duration: {
//     data: { pageNumber: string; sum_duration: number }[];
//   };
// }

// export function useVisitorStats(viewId: string) {
//   // this gets the data for a single visitor's graph
//   const router = useRouter();
//   const teamInfo = useTeam();

//   const { id: documentId } = router.query as {
//     id: string;
//   };

//   const { data: stats, error } = useSWR<StatsViewData>(
//     documentId &&
//       viewId &&
//       `/api/teams/${teamInfo?.currentTeam?.id}/documents/${encodeURIComponent(
//         documentId,
//       )}/views/${encodeURIComponent(viewId)}/stats`,
//     fetcher,
//     {
//       dedupingInterval: 10000,
//     },
//   );

//   return {
//     stats,
//     loading: !error && !stats,
//     error,
//   };
// }
