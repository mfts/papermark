import { useTeam } from "@/context/team-context";
import type { SAMLSSORecord } from "@boxyhq/saml-jackson";
import useSWRImmutable from "swr/immutable";

import { fetcher } from "@/lib/utils";

interface SAMLConfigResponse {
  connections: SAMLSSORecord[];
  issuer: string;
  acs: string;
  ssoEmailDomain: string | null;
  ssoEnforcedAt: string | null;
  slug: string | null;
}

export default function useSAML(teamIdOverride?: string | null) {
  const { currentTeamId } = useTeam();
  const teamId = teamIdOverride ?? currentTeamId;

  const { data, error, isLoading, mutate } = useSWRImmutable<SAMLConfigResponse>(
    teamId ? `/api/teams/${teamId}/saml` : null,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      shouldRetryOnError: false,
      dedupingInterval: 60_000,
    },
  );

  const configured = !!(data?.connections && data.connections.length > 0);

  return {
    saml: data,
    connections: data?.connections ?? [],
    issuer: data?.issuer ?? "",
    acs: data?.acs ?? "",
    ssoEmailDomain: data?.ssoEmailDomain ?? null,
    ssoEnforcedAt: data?.ssoEnforcedAt ?? null,
    slug: data?.slug ?? null,
    provider: configured
      ? data!.connections[0].idpMetadata?.provider ?? null
      : null,
    configured,
    loading: isLoading && !data,
    error,
    mutate,
  };
}
