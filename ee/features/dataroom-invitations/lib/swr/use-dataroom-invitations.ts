import useSWR from "swr";

import { useTeam } from "@/context/team-context";

import { fetcher } from "@/lib/utils";

type UninvitedMembersResponse = {
  count: number;
  emails: string[];
};

export function useUninvitedMembers(
  dataroomId?: string,
  groupId?: string,
) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const {
    data,
    error,
    mutate,
  } = useSWR<UninvitedMembersResponse>(
    teamId && dataroomId && groupId
      ? `/api/teams/${teamId}/datarooms/${dataroomId}/groups/${groupId}/uninvited`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 15000,
    },
  );

  return {
    uninvitedCount: data?.count ?? 0,
    uninvitedEmails: data?.emails ?? [],
    loading: !data && !error,
    error,
    mutate,
  };
}


