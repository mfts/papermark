import useSWRImmutable from "swr/immutable";

import { DocumentPreviewData } from "@/lib/types/document-preview";
import { fetcher } from "@/lib/utils";

export function useDocumentPreview(documentId: string, isOpen: boolean) {
  const {
    data: document,
    error,
    mutate,
  } = useSWRImmutable<DocumentPreviewData>(
    isOpen && documentId ? `/api/documents/${documentId}/preview-data` : null,
    fetcher,
    {
      dedupingInterval: 10000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    document,
    loading: !error && !document && isOpen,
    error,
    mutate,
  };
}
