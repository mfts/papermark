import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import { Viewer } from "@prisma/client";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

type ViewerWithStats = {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  totalVisits: number;
  lastViewed: Date | null;
};

type ViewersResponse = {
  viewers: ViewerWithStats[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  sorting: {
    sortBy: string;
    sortOrder: string;
  };
};

export default function useViewers(
  page: number = 1,
  pageSize: number = 10,
  sortBy: string = "lastViewed",
  sortOrder: string = "desc"
) {
  const router = useRouter();
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const routerQuery = router.query;
  const searchQuery = routerQuery["search"];

  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('pageSize', pageSize.toString());
  queryParams.append('sortBy', sortBy);
  queryParams.append('sortOrder', sortOrder);

  if (searchQuery && typeof searchQuery === 'string') {
    queryParams.append('query', searchQuery);
  }

  const queryString = queryParams.toString();

  const {
    data: response,
    isValidating,
    error,
    mutate,
  } = useSWR<ViewersResponse>(
    teamId
      ? `/api/teams/${teamId}/viewers?${queryString}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000,
      keepPreviousData: true,
      refreshInterval: 0,
      errorRetryCount: 2,
      errorRetryInterval: 5000,
    },
  );

  return {
    viewers: response?.viewers,
    pagination: response?.pagination,
    sorting: response?.sorting,
    isValidating,
    loading: !response && !error,
    isFiltered: !!searchQuery,
    error,
    mutate,
  };
}
