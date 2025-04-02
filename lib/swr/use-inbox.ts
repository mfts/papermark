import { useTeam } from "@/context/team-context";
import useSWR from "swr";

import { LinkWithViews } from "../types";
import { fetcher } from "../utils";

export function useInboxLinks() {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: links, error } = useSWR<LinkWithViews[]>(
    teamId && `/api/teams/${teamId}/inbox/links`,
    fetcher,
    { dedupingInterval: 10000 },
  );

  return {
    links,
    loading: !error && !links,
    error,
  };
}
