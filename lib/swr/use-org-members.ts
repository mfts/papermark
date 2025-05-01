import useSWR from "swr";
import { fetcher } from "@/lib/utils";
interface OrgMembersResponse {
  members: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  }[];
}

export function useOrgMembers(teamId: string) {

  const { data, error, mutate } = useSWR<OrgMembersResponse>(
    teamId ? `/api/teams/${teamId}/organization/members` : null,
    fetcher
  );

  return {
    members: data?.members,
    isLoading: !error && !data,
    error,
    mutate,
  };
}