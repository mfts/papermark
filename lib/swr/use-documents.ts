import { useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";
import { useTeam } from "@/context/team-context";

export default function useDocuments() {
  const router = useRouter();
  const teamInfo = useTeam();

  const { data: documents, isValidating } = useSWR<
    DocumentWithLinksAndLinkCountAndViewCount[]
  >(
    router.isReady && `/api/teams/${teamInfo?.currentTeam?.id}/documents`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  return {
    documents,
    loading: documents ? false : true,
    isValidating,
  };
}
