import { useTeam } from "@/context/team-context";
import useSWR from "swr";
import { z } from "zod";

import { fetcher } from "@/lib/utils";

import { configSchema } from "./server";

export type LimitProps = z.infer<typeof configSchema> & {
  usage: {
    documents: number;
    links: number;
    users: number;
  };
  dataroomUpload?: boolean;
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
  const canAddUsers = data?.users ? data?.usage?.users < data?.users : true;

  return {
    limits: data,
    canAddDocuments,
    canAddLinks,
    canAddUsers,
    error,
    loading: !data && !error,
  };
}
