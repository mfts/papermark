import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { DomainResponse, DomainVerificationStatusProps, DomainEmailDNSVerificationStatusProps } from "@/lib/types";
import { DomainRecords } from "resend/build/src/domains/interfaces/domain";
import { useTeam } from "@/context/team-context";

export function useDomainStatus({ domain }: { domain: string }) {
  const teamInfo = useTeam();

  const { data, isValidating } = useSWR<{
    status: { domainStatus : DomainVerificationStatusProps, domainEmailDNSStatus: DomainEmailDNSVerificationStatusProps };
    domainJson: DomainResponse & { error: { code: string; message: string } };
    emailDNSRecords: DomainRecords[]
  }>(
    `/api/teams/${teamInfo?.currentTeam?.id}/domains/${domain}/verify`,
    (input, init) => fetcher(input, { ...init, cache: "no-store" }),
    {
      revalidateOnMount: true,
      refreshInterval: 5000,
      keepPreviousData: true,
    }
  );

  return {
    status: data?.status,
    domainJson: data?.domainJson,
    emailDNSRecords: data?.emailDNSRecords,
    loading: isValidating,
  };
}
