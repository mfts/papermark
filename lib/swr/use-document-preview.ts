import useSWRImmutable from "swr/immutable";

import { fetcher } from "@/lib/utils";

interface DocumentPreviewData {
  documentId: string;
  documentName: string;
  documentType: string;
  fileType: string;
  isVertical: boolean;
  numPages: number;
  pages?: {
    file: string;
    pageNumber: string;
    embeddedLinks: string[];
    pageLinks: { href: string; coords: string }[];
    metadata: { width: number; height: number; scaleFactor: number };
  }[];
  file?: string;
  sheetData?: any;
}

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
