import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import { Folder } from "@prisma/client";
import useSWR from "swr";

import { DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";
import { fetcher } from "@/lib/utils";

export default function useDocuments() {
  const router = useRouter();
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const queryParams = router.query;
  const searchQuery = queryParams["search"];
  const sortQuery = queryParams["sort"];
  const page = Number(queryParams["page"]) || 1;
  const pageSize = Number(queryParams["limit"]) || 10;

  const paginationParams =
    searchQuery || sortQuery ? `&page=${page}&limit=${pageSize}` : "";

  const queryParts = [];
  if (searchQuery) queryParts.push(`query=${searchQuery}`);
  if (sortQuery) queryParts.push(`sort=${sortQuery}`);
  if (paginationParams) queryParts.push(paginationParams.substring(1));
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  const { data, isValidating, error } = useSWR<{
    documents: DocumentWithLinksAndLinkCountAndViewCount[];
    pagination?: {
      total: number;
      pages: number;
      currentPage: number;
      pageSize: number;
    };
  }>(
    teamId && `/api/teams/${teamId}/documents${queryString}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      keepPreviousData: true,
    },
  );

  return {
    documents: data?.documents || [],
    pagination: data?.pagination,
    isValidating,
    loading: !data && !error,
    isFiltered: !!searchQuery || !!sortQuery,
    error,
  };
}

export function useFolderDocuments({ name }: { name: string[] }) {
  const router = useRouter();
  const teamInfo = useTeam();

  const queryParams = router.query;
  const searchQuery = queryParams["search"];
  const sortQuery = queryParams["sort"];

  const queryParts = [];
  if (searchQuery) queryParts.push(`query=${searchQuery}`);
  if (sortQuery) queryParts.push(`sort=${sortQuery}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  const {
    data: documents,
    error,
    isValidating,
  } = useSWR<DocumentWithLinksAndLinkCountAndViewCount[]>(
    teamInfo?.currentTeam?.id &&
    name.length > 0 &&
    `/api/teams/${teamInfo?.currentTeam?.id
    }/folders/documents/${name.join("/")}${queryString}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  return {
    documents,
    loading: !documents && !error,
    isValidating,
    isFiltered: !!searchQuery || !!sortQuery,
    error,
  };
}

export type FolderWithCount = Folder & {
  _count: {
    documents: number;
    childFolders: number;
  };
};

export function useFolder({ name }: { name: string[] }) {
  const router = useRouter();
  const teamInfo = useTeam();

  const queryParams = router.query;
  const searchQuery = queryParams["search"];

  const queryParts = [];
  if (searchQuery) queryParts.push(`query=${searchQuery}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  const {
    data: folders,
    error,
    isValidating,
  } = useSWR<FolderWithCount[]>(
    teamInfo?.currentTeam?.id &&
    name.length > 0 &&
    `/api/teams/${teamInfo?.currentTeam?.id
    }/folders/${name.join("/")}${queryString}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      onError: (err) => {
        if (err.status === 404) {
          router.replace("/documents");
        }
      },
    },
  );

  return {
    folders,
    loading: !folders && !error,
    isValidating,
    isFiltered: !!searchQuery,
    error,
  };
}

export type FolderWithDocuments = Folder & {
  childFolders: FolderWithDocuments[];
  documents: {
    id: string;
    name: string;
    folderId: string;
  }[];
};

export function useFolders() {
  const teamInfo = useTeam();

  const { data: folders, error } = useSWR<FolderWithDocuments[]>(
    teamInfo?.currentTeam?.id &&
      `/api/teams/${teamInfo?.currentTeam?.id}/folders`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  return {
    folders,
    loading: !folders && !error,
    error,
  };
}

export function useRootFolders() {
  const teamInfo = useTeam();

  const { data: folders, error } = useSWR<FolderWithCount[]>(
    teamInfo?.currentTeam?.id &&
      `/api/teams/${teamInfo?.currentTeam?.id}/folders?root=true`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  return {
    folders,
    loading: !folders && !error,
    error,
  };
}
