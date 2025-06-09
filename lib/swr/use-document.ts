import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import { View } from "@prisma/client";
import useSWR from "swr";
import { DocumentWithVersion, LinkWithViews } from "@/lib/types";
import { fetcher } from "@/lib/utils";
import { toast } from "sonner";

export function useDocument() {
  const router = useRouter();
  const teamInfo = useTeam();

  const { id } = router.query as {
    id: string;
  };

  const {
    data: document,
    error,
    mutate,
  } = useSWR<DocumentWithVersion>(
    teamInfo?.currentTeam?.id &&
      id &&
      `/api/teams/${teamInfo?.currentTeam?.id}/documents/${encodeURIComponent(
        id,
      )}`,
    fetcher,
    {
      dedupingInterval: 10000,
      onError: (err) => {
        if (err.status === 404) {
          toast.error("Document not found", {
            description: "The document you're looking for doesn't exist or has been moved.",
          });
          router.replace("/documents");
        }
      }
    },
  );

  return {
    document,
    primaryVersion: document?.versions[0],
    loading: !error && !document,
    error,
    mutate,
  };
}

export function useDocumentLinks(
  page: number = 1,
  limit: number = 10,
  search?: string,
  tags?: string[]
) {
  const router = useRouter();
  const teamInfo = useTeam();

  const { id } = router.query as {
    id: string;
  };

  const searchParams = new URLSearchParams();
  searchParams.set("page", page.toString());
  searchParams.set("limit", limit.toString());
  if (search) searchParams.set("search", search);
  if (tags?.length) searchParams.set("tags", tags.join(","));
  // GET /api/teams/:teamId/documents/:id/links?page=1&limit=10&search=test&tags=tag1,tag2
  const { data, error, isValidating } = useSWR<{
    links: LinkWithViews[];
    pagination: {
      total: number;
      pages: number;
      page: number;
      limit: number;
    };
  }>(
    teamInfo?.currentTeam?.id &&
      id &&
      `/api/teams/${teamInfo?.currentTeam?.id}/documents/${encodeURIComponent(
        id,
    )}/links?${searchParams.toString()}`,
    fetcher,
    {
      dedupingInterval: 10000,
    },
  );

  return {
    links: data?.links,
    pagination: data?.pagination,
    loading: !error && !data,
    isValidating,
    error,
  };
}

interface ViewWithDuration extends View {
  internal: boolean;
  duration: {
    data: { pageNumber: string; sum_duration: number }[];
  };
  totalDuration: number;
  completionRate: number;
  link: {
    name: string | null;
  };
  feedbackResponse: {
    id: string;
    data: {
      question: string;
      answer: string;
    };
  } | null;
  agreementResponse: {
    id: string;
    agreementId: string;
    agreement: {
      name: string;
    };
  } | null;
  versionNumber: number;
  versionNumPages: number;
}

type TStatsData = {
  hiddenViewCount: number;
  viewsWithDuration: ViewWithDuration[];
  totalViews: number;
};

export function useDocumentVisits(page: number, limit: number) {
  const router = useRouter();
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { id } = router.query as {
    id: string;
  };

  const cacheKey =
    teamId && id
      ? `/api/teams/${teamId}/documents/${id}/views?page=${page}&limit=${limit}`
      : null;

  const {
    data: views,
    error,
    mutate,
  } = useSWR<TStatsData>(cacheKey, fetcher, {
    dedupingInterval: 20000,
  });

  return {
    views,
    loading: !error && !views,
    error,
    mutate,
  };
}

interface DocumentProcessingStatus {
  currentPageCount: number;
  totalPages: number;
  hasPages: boolean;
}

export function useDocumentProcessingStatus(documentVersionId: string) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: status, error } = useSWR<DocumentProcessingStatus>(
    teamId &&
      `/api/teams/${teamId}/documents/document-processing-status?documentVersionId=${documentVersionId}`,
    fetcher,
    {
      refreshInterval: 3000, // refresh every 3 seconds
    },
  );

  return {
    status: status,
    loading: !error && !status,
    error: error,
  };
}

export function useDocumentThumbnail(
  pageNumber: number,
  documentId: string,
  versionNumber?: number,
) {
  const { data, error } = useSWR<{ imageUrl: string }>(
    pageNumber === 0
      ? null
      : `/api/jobs/get-thumbnail?documentId=${documentId}&pageNumber=${pageNumber}&versionNumber=${versionNumber}`,
    fetcher,
    {
      dedupingInterval: 1200000,
      revalidateOnFocus: false,
      // revalidateOnMount: false,
      revalidateIfStale: false,
      refreshInterval: 0,
    },
  );

  if (pageNumber === 0) {
    return {
      data: null,
      loading: false,
      error: null,
    };
  }

  return {
    data,
    loading: !error && !data,
    error,
  };
}
