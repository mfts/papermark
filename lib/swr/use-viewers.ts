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

  const queryParams = router.query;
  const searchQuery = queryParams["search"];

  const searchParam = searchQuery ? `&query=${searchQuery}` : "";
  const paginationParam = `page=${page}&pageSize=${pageSize}`;
  const sortingParam = `&sortBy=${sortBy}&sortOrder=${sortOrder}`;

  const {
    data: response,
    isValidating,
    error,
  } = useSWR<ViewersResponse>(
    teamId
      ? `/api/teams/${teamId}/viewers?${paginationParam}${searchParam}${sortingParam}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      keepPreviousData: true,
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
  };
}
