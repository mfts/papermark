import { useTeam } from "@/context/team-context";
import useSWRImmutable from "swr/immutable";

import { DocumentPreviewData } from "@/lib/types/document-preview";
import { fetcher } from "@/lib/utils";

export function useDocumentPreview(documentId: string, isOpen: boolean) {
  const { currentTeamId } = useTeam();

  const {
    data: document,
    error,
    mutate,
  } = useSWRImmutable<DocumentPreviewData>(
    isOpen && currentTeamId && documentId
      ? `/api/teams/${currentTeamId}/documents/${documentId}/preview-data`
      : null,
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
