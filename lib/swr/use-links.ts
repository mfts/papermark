import { useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { SavedLink } from "@prisma/client";

interface SavedLinkWithDocumentProps extends SavedLink {
  link: {
    id: string;
    name: string | null;
    document: {
      id: string;
      name: string | null;
    };
  }
}

export default function useSavedLinks() {
  const router = useRouter();

  const { data: savedLinks, isValidating } = useSWR<
    SavedLinkWithDocumentProps[]
  >(router.isReady && `/api/links/savedLinks`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  return {
    savedLinks,
    loading: savedLinks ? false : true,
    isValidating,
  };
}
