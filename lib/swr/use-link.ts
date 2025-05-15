import { useRouter } from "next/router";

import { View } from "@prisma/client";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

import { LinkWithDocument } from "../types";

export function useLink() {
  const router = useRouter();

  const { linkId } = router.query as {
    linkId: string;
  };

  // only fetch data once when linkId is present
  const { data: link, error } = useSWR<LinkWithDocument>(
    linkId && `/api/links/${encodeURIComponent(linkId)}`,
    fetcher,
    {
      dedupingInterval: 10000,
    },
  );

  return {
    link,
    loading: !error && !link,
    error,
  };
}

export function useDomainLink() {
  const router = useRouter();

  const { domain, slug } = router.query as {
    domain: string;
    slug: string;
  };

  const { data: link, error } = useSWR<LinkWithDocument>(
    domain &&
      slug &&
      `/api/links/domains/${encodeURIComponent(domain)}/${encodeURIComponent(
        slug,
      )}`,
    fetcher,
    {
      dedupingInterval: 10000,
    },
  );

  return {
    link,
    loading: !error && !link,
    error,
  };
}

interface ViewWithDuration extends View {
  duration: {
    data: { pageNumber: string; sum_duration: number }[];
  };
  totalDuration: number;
  completionRate: number;
}

export function useLinkVisits(linkId: string, page: number = 1, pageSize: number = 10) {
  const { data, error } = useSWR<{
    views: ViewWithDuration[];
    pagination: {
      total: number;
      pages: number;
      currentPage: number;
      pageSize: number;
    };
  }>(
    linkId && `/api/links/${encodeURIComponent(linkId)}/visits?page=${page}&limit=${pageSize}`,
    fetcher,
    {
      dedupingInterval: 10000,
    },
  );

  return {
    views: data?.views,
    pagination: data?.pagination,
    loading: !error && !data,
    error,
  };
}
