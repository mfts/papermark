import { useTeam } from "@/context/team-context";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";

import {
  DomainConfigResponse,
  DomainResponse,
  DomainVerificationStatusProps,
} from "@/lib/types";
import { fetcher } from "@/lib/utils";

export function useDomainStatus({
  domain,
  enabled = true,
}: {
  domain: string;
  enabled?: boolean;
}) {
  const teamInfo = useTeam();

  const key =
    enabled && domain
      ? `/api/teams/${teamInfo?.currentTeam?.id}/domains/${domain}/verify`
      : null;

  const { data, isValidating, mutate } = useSWR<{
    status: DomainVerificationStatusProps;
    response: {
      domainJson: DomainResponse & { error: { code: string; message: string } };
      configJson: DomainConfigResponse;
    };
  }>(key, fetcher);

  return {
    status: data?.status,
    domainJson: data?.response.domainJson,
    configJson: data?.response.configJson,
    loading: isValidating,
    mutate,
  };
}
