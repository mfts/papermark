import { useTeam } from "@/context/team-context";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";

import {
  DomainConfigResponse,
  DomainResponse,
  DomainVerificationStatusProps,
} from "@/lib/types";
import { fetcher } from "@/lib/utils";

export function useDomainStatus({ domain }: { domain: string }) {
  const teamInfo = useTeam();

  const { data, isValidating, mutate } = useSWR<{
    status: DomainVerificationStatusProps;
    response: {
      domainJson: DomainResponse & { error: { code: string; message: string } };
      configJson: DomainConfigResponse;
    };
  }>(
    `/api/teams/${teamInfo?.currentTeam?.id}/domains/${domain}/verify`,
    fetcher,
  );

  return {
    status: data?.status,
    domainJson: data?.response.domainJson,
    configJson: data?.response.configJson,
    loading: isValidating,
    mutate,
  };
}
