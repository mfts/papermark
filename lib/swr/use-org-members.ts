import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { isOrganizationEmail } from "../utils/email-domain";

interface OrgMembersResponse {
  members: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  }[];
}

export function useOrgMembers(teamId: string) {
  const { data: session } = useSession();
  const email = session?.user?.email;

  const shouldFetch = email && isOrganizationEmail(email);

  const { data, error, mutate } = useSWR<OrgMembersResponse>(
    shouldFetch && teamId ? `/api/teams/${teamId}/organization/members` : null,
    fetcher
  );

  return {
    members: data?.members,
    isLoading: !error && !data,
    error,
    mutate,
  };
}