import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export interface Annotation {
  id: string;
  title: string;
  content: any;
  pages: number[];
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string | null;
  };
  images: {
    id: string;
    filename: string;
    url: string;
    size: number | null;
    mimeType: string | null;
    createdAt: string;
  }[];
}

export function useAnnotations(documentId: string, teamId: string) {
  const { data, error, mutate } = useSWR<Annotation[]>(
    `/api/teams/${teamId}/documents/${documentId}/annotations`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    annotations: data,
    loading: !error && !data,
    error,
    mutate,
  };
}

export function useViewerAnnotations(
  linkId: string,
  documentId?: string,
  viewId?: string,
) {
  // For dataroom document links, use the specific document endpoint
  // For regular document links, use the general link endpoint
  const endpoint = documentId
    ? `/api/links/${linkId}/documents/${documentId}/annotations?viewId=${viewId}`
    : `/api/links/${linkId}/annotations?viewId=${viewId}`;

  const { data, error, mutate } = useSWR<Omit<Annotation, "createdBy">[]>(
    endpoint,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    annotations: data,
    loading: !error && !data,
    error,
    mutate,
  };
}
