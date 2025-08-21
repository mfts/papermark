import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import { View } from "@prisma/client";
import { toast } from "sonner";
import useSWR from "swr";

import { DocumentWithVersion, LinkWithViews } from "@/lib/types";
import { fetcher } from "@/lib/utils";

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
      // Reduce background-driven revalidation to avoid excessive API traffic
      dedupingInterval: 30000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      onError: (err) => {
        if (err.status === 404) {
          toast.error("Document not found", {
            description:
              "The document you're looking for doesn't exist or has been moved.",
          });
          router.replace("/documents");
        }
      },
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

export function useDocumentLinks() {
  const router = useRouter();
  const teamInfo = useTeam();

  const { id } = router.query as {
    id: string;
  };

  const { data: links, error } = useSWR<LinkWithViews[]>(
    teamInfo?.currentTeam?.id &&
      id &&
      `/api/teams/${teamInfo?.currentTeam?.id}/documents/${encodeURIComponent(
        id,
      )}/links`,
    fetcher,
    {
      dedupingInterval: 10000,
    },
  );

  return {
    links,
    loading: !error && !links,
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
  const { data, error, isLoading, isValidating } = useSWR<{ imageUrl: string }>(
    // Only make request if we have valid parameters
    pageNumber === 0 || !documentId
      ? null
      : `/api/jobs/get-thumbnail?documentId=${documentId}&pageNumber=${pageNumber}&versionNumber=${versionNumber}`,
    fetcher,
    {
      dedupingInterval: 1200000,
      revalidateOnFocus: false,
      revalidateIfStale: false,
      refreshInterval: 0,
      // Add error retry with exponential backoff for 404s (document processing)
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      shouldRetryOnError: (error) => {
        // Retry on 404s (thumbnail not ready) but not on other errors
        if (error?.status === 404) return true;
        if (error?.status === 500) return false; // Don't retry server errors
        return true;
      },
      onError: (error, key) => {
        // Log errors for debugging but don't throw
        if (error?.status !== 404) {
          console.warn(`Thumbnail fetch error for ${key}:`, error);
        }
      },
    },
  );

  if (pageNumber === 0 || !documentId) {
    return {
      data: null,
      loading: false,
      error: null,
    };
  }

  return {
    data,
    loading: isLoading || isValidating,
    error,
  };
}
