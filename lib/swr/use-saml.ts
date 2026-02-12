import { useTeam } from "@/context/team-context";
import type { SAMLSSORecord } from "@boxyhq/saml-jackson";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export default function useSAML() {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data, isLoading, mutate } = useSWR<{
    connections: SAMLSSORecord[];
    issuer: string;
    acs: string;
    ssoEmailDomain: string | null;
    ssoEnforcedAt: string | null;
    slug: string | null;
  }>(teamId ? `/api/teams/${teamId}/saml` : null, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60_000,
  });

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
    loading: isLoading,
    mutate,
  };
}
