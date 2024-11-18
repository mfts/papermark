import { useRouter } from "next/router";

import { useMemo } from "react";

import { useTeam } from "@/context/team-context";
import { Dataroom, DataroomDocument, DataroomFolder } from "@prisma/client";
import useSWR from "swr";

import { LinkWithViews } from "@/lib/types";
import { fetcher } from "@/lib/utils";

export type DataroomFolderWithCount = DataroomFolder & {
  _count: {
    documents: number;
    childFolders: number;
  };
};

export function useDataroom() {
  const router = useRouter();

  const { id } = router.query as {
    id: string;
  };

  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: dataroom, error } = useSWR<Dataroom>(
    teamId && id && `/api/teams/${teamId}/datarooms/${id}`,
    fetcher,
    { dedupingInterval: 10000 },
  );

  return {
    dataroom,
    loading: !error && !dataroom,
    error,
  };
}

export function useDataroomLinks() {
  const router = useRouter();

  const { id } = router.query as {
    id: string;
  };

  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: links, error } = useSWR<LinkWithViews[]>(
    teamId && id && `/api/teams/${teamId}/datarooms/${id}/links`,
    fetcher,
    { dedupingInterval: 10000 },
  );

  return {
    links,
    loading: !error && !links,
    error,
  };
}

export function useDataroomItems({
  root,
  name,
}: {
  root?: boolean;
  name?: string[];
}) {
  const router = useRouter();
  const { id } = router.query as {
    id: string;
  };
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: folderData, error: folderError } = useSWR<
    DataroomFolderWithCount[]
  >(
    teamId &&
      id &&
      `/api/teams/${teamId}/datarooms/${id}/folders${root ? "?root=true" : name ? `/${name.join("/")}` : ""}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  const { data: documentData, error: documentError } = useSWR<
    DataroomFolderDocument[]
  >(
    teamId &&
      id &&
      `/api/teams/${teamId}/datarooms/${id}${name ? `/folders/documents/${name.join("/")}` : "/documents"}`,

    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  const isLoading =
    !folderData && !documentData && !folderError && !documentError;
  const error = folderError || documentError;

  const combinedItems = useMemo(() => {
    if (!folderData && !documentData) return [];

    const allItems = [
      ...(folderData || []).map((folder) => ({
        ...folder,
        itemType: "folder",
      })),
      ...(documentData || []).map((doc) => ({ ...doc, itemType: "document" })),
    ];

    return allItems.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }, [folderData, documentData]);

  return {
    items: combinedItems as (
      | (DataroomFolderWithCount & { itemType: "folder" })
      | (DataroomFolderDocument & { itemType: "document" })
    )[],
    folderCount: folderData?.length || 0,
    documentCount: documentData?.length || 0,
    isLoading,
    error,
  };
}

export function useDataroomDocuments() {
  const router = useRouter();

  const { id } = router.query as {
    id: string;
  };

  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: documents, error } = useSWR<DataroomFolderDocument[]>(
    teamId && id && `/api/teams/${teamId}/datarooms/${id}/documents`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  return {
    documents,
    loading: !documents && !error,
    error,
  };
}

export function useDataroomFolders({
  root,
  name,
}: {
  root?: boolean;
  name?: string[];
}) {
  const router = useRouter();

  const { id } = router.query as {
    id: string;
  };

  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: folders, error } = useSWR<DataroomFolderWithCount[]>(
    teamId &&
      id &&
      `/api/teams/${teamId}/datarooms/${id}/folders${root ? "?root=true" : name ? `/${name.join("/")}` : ""}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  return {
    folders,
    loading: !folders && !error,
    error,
  };
}

export type DataroomFolderWithDocuments = DataroomFolder & {
  childFolders: DataroomFolderWithDocuments[];
  documents: {
    id: string;
    folderId: string;
    document: {
      id: string;
      name: string;
      type: string;
    };
  }[];
};

export function useDataroomFoldersTree({
  dataroomId,
  include_documents,
}: {
  dataroomId: string;
  include_documents?: boolean;
}) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: folders, error } = useSWR<DataroomFolderWithDocuments[]>(
    teamId &&
      `/api/teams/${teamId}/datarooms/${dataroomId}/folders${include_documents ? "?include_documents=true" : ""}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  return {
    folders,
    loading: !folders && !error,
    error,
  };
}

export function useDataroomFolderWithParents({
  name,
  dataroomId,
}: {
  name: string[];
  dataroomId: string;
}) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: folders, error } = useSWR<{ name: string; path: string }[]>(
    teamId &&
      name &&
      `/api/teams/${teamId}/datarooms/${dataroomId}/folders/parents/${name.join("/")}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  return {
    folders,
    loading: !folders && !error,
    error,
  };
}

export type DataroomFolderDocument = DataroomDocument & {
  document: {
    id: string;
    name: string;
    type: string;
    _count: {
      views: number;
      versions: number;
    };
  };
};

export function useDataroomFolderDocuments({ name }: { name: string[] }) {
  const router = useRouter();

  const { id } = router.query as {
    id: string;
  };

  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: documents, error } = useSWR<DataroomFolderDocument[]>(
    teamId &&
      id &&
      name &&
      `/api/teams/${teamId}/datarooms/${id}/folders/documents/${name.join("/")}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  return {
    documents,
    loading: !documents && !error,
    error,
  };
}

export function useDataroomViewers({ dataroomId }: { dataroomId: string }) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: viewers, error } = useSWR<any[]>(
    teamId &&
      dataroomId &&
      `/api/teams/${teamId}/datarooms/${dataroomId}/viewers`,
    fetcher,
    {
      dedupingInterval: 10000,
    },
  );

  return {
    viewers,
    loading: !error && !viewers,
    error,
  };
}

export function useDataroomVisits({ dataroomId }: { dataroomId: string }) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: views, error } = useSWR<any[]>(
    teamId &&
      dataroomId &&
      `/api/teams/${teamId}/datarooms/${dataroomId}/views`,
    fetcher,
    {
      dedupingInterval: 10000,
    },
  );

  return {
    views,
    loading: !error && !views,
    error,
  };
}

type DataroomDocumentViewHistory = {
  id: string;
  downloadedAt: string;
  viewedAt: string;
  document: {
    id: string;
    name: string;
  };
};

export function useDataroomVisitHistory({
  viewId,
  dataroomId,
}: {
  viewId: string;
  dataroomId: string;
}) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: documentViews, error } = useSWR<DataroomDocumentViewHistory[]>(
    teamId &&
      dataroomId &&
      `/api/teams/${teamId}/datarooms/${dataroomId}/views/${viewId}/history`,
    fetcher,
    {
      dedupingInterval: 10000,
    },
  );

  return {
    documentViews,
    loading: !error && !documentViews,
    error,
  };
}
