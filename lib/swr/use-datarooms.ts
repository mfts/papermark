import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import { Dataroom } from "@prisma/client";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export type DataroomWithCount = Dataroom & {
  _count: {
    documents: number;
    views: number;
  };
  links: {
    id: string;
    isArchived: boolean;
    expiresAt: Date | null;
    createdAt: Date;
  }[];
  views: {
    viewedAt: Date;
  }[];
  tags?: {
    tag: {
      id: string;
      name: string;
      color: string;
      description: string | null;
    };
  }[];
};

export type DataroomsResponse = {
  datarooms: DataroomWithCount[];
  totalCount: number;
};

export default function useDatarooms() {
  const router = useRouter();
  const teamInfo = useTeam();

  const queryParams = router.query;
  const searchQuery = queryParams["search"];
  const statusQuery = queryParams["status"];
  const tagsQuery = queryParams["tags"];

  const queryParts = [];
  if (searchQuery) queryParts.push(`search=${searchQuery}`);
  if (statusQuery) queryParts.push(`status=${statusQuery}`);
  if (tagsQuery) queryParts.push(`tags=${tagsQuery}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  const { data, error, mutate } = useSWR<DataroomsResponse>(
    teamInfo?.currentTeam?.id &&
      `/api/teams/${teamInfo?.currentTeam?.id}/datarooms${queryString}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      keepPreviousData: true,
    },
  );

  return {
    datarooms: data?.datarooms,
    totalCount: data?.totalCount,
    loading: !data && !error,
    error,
    mutate,
  };
}
