import { useRouter } from "next/router";

import { LinkType, View } from "@prisma/client";
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

export interface ViewWithDuration extends View {
  duration?: {
    data: { pageNumber: string; sum_duration: number }[];
  };
  totalDuration?: number;
  completionRate?: number;
  uploadFolder?: {
    path: string,
  },
  uploadDataroomFolder?: {
    path: string,
    dataroom: {
      name: string;
      id: string;
    };
  };
}

export function useLinkVisits(linkId: string, linkType?: LinkType) {
  const { data: views, error } = useSWR<ViewWithDuration[]>(
    linkId && linkType === "FILE_REQUEST_LINK"
      ? `/api/links/${encodeURIComponent(linkId)}/visits-requestFile`
      : `/api/links/${encodeURIComponent(linkId)}/visits`,
    fetcher,
    {
      dedupingInterval: 10000,
    },
  );

  return {
    views,
    loading: !error && !views,
    error,
  };
}
