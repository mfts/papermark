import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { DomainResponse, DomainVerificationStatusProps } from "@/lib/types";
import { useTeam } from "@/context/team-context";

export function useDomainStatus({ domain }: { domain: string }) {
  const teamInfo = useTeam();

  const { data, isValidating } = useSWR<{
    status: DomainVerificationStatusProps;
    domainJson: DomainResponse & { error: { code: string; message: string } };
  }>(
    `/api/teams/${teamInfo?.currentTeam?.id}/domains/${domain}/verify`,
    (input, init) => fetcher(input, { ...init, cache: "no-store" }),
    {
      revalidateOnMount: true,
      refreshInterval: 5000,
      keepPreviousData: true,
    },
  );

  return {
    status: data?.status,
    domainJson: data?.domainJson,
    loading: isValidating,
  };
}
