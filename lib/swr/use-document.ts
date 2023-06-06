import { useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { LinkWithViews } from "@/lib/types";
import { Document } from "@prisma/client";

export function useDocument() {
  const router = useRouter();

  const { id } = router.query as {
    id: string;
  };

  const { data: document, error } = useSWR<Document>(
    id && `/api/documents/${encodeURIComponent(id)}`,
    fetcher,
    {
      dedupingInterval: 10000,
    }
  );

  return {
    document,
    loading: !error && !document,
    error,
  };
}

export function useDocumentLinks() {
  const router = useRouter();

  const { id } = router.query as {
    id: string;
  };

  const { data: links, error } = useSWR<LinkWithViews[]>(
    id && `/api/documents/${encodeURIComponent(id)}/links`,
    fetcher,
    {
      dedupingInterval: 10000,
    }
  );

  return {
    links,
    loading: !error && !links,
    error,
  };
}
