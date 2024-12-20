import { useTeam } from "@/context/team-context";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export type LimitProps = {
  datarooms: number;
  links: number | undefined | null;
  documents: number | undefined | null;
  users: number;
  domains: number;
  customDomainOnPro: boolean;
  customDomainInDataroom: boolean;
  advancedLinkControlsOnPro: boolean | undefined | null;
  watermarkOnBusiness: boolean | undefined | null;
  usage: {
    documents: number;
    links: number;
  };
};

export function useLimits() {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data, error } = useSWR<LimitProps | null>(
    teamId && `/api/teams/${teamId}/limits`,
    fetcher,
    {
      dedupingInterval: 30000,
    },
  );

  const canAddDocuments = data?.documents
    ? data?.usage?.documents < data?.documents
    : true;
  const canAddLinks = data?.links ? data?.usage?.links < data?.links : true;

  return {
    limits: data,
    canAddDocuments,
    canAddLinks,
    error,
    loading: !data && !error,
  };
}
