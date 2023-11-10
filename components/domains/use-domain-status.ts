import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { DomainResponse, DomainVerificationStatusProps, DomainEmailDNSVerificationStatusProps } from "@/lib/types";
import { DomainRecords } from "resend/build/src/domains/interfaces/domain";

export function useDomainStatus({ domain }: { domain: string }) {
  const { data, isValidating } = useSWR<{
    status: { domainStatus : DomainVerificationStatusProps, domainEmailDNSStatus: DomainEmailDNSVerificationStatusProps };
    domainJson: DomainResponse & { error: { code: string; message: string } };
    emailDNSRecords: DomainRecords[]
  }>(
    `/api/domains/${domain}/verify`,
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
