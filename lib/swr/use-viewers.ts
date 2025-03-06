import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import { Viewer } from "@prisma/client";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export default function useViewers() {
  const router = useRouter();
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const queryParams = router.query;
  const searchQuery = queryParams["search"];

  const {
    data: viewers,
    isValidating,
    error,
  } = useSWR<Viewer[]>(
    teamId &&
      `/api/teams/${teamId}/viewers${searchQuery ? `?query=${searchQuery}` : ""}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      keepPreviousData: true,
    },
  );

  return {
    viewers,
    isValidating,
    loading: !viewers && !error,
    isFiltered: !!searchQuery,
    error,
  };
}
