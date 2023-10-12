import { useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";

export default function useDocuments() {
  const router = useRouter();

  const { data: documents, isValidating } = useSWR<
    DocumentWithLinksAndLinkCountAndViewCount[]
  >(router.isReady && `/api/documents`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  return {
    documents,
    loading: documents ? false : true,
    isValidating,
  };
}
