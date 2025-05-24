import { useRouter } from "next/router";

import { useMemo } from "react";

import { useTeam } from "@/context/team-context";
import { Dataroom, DataroomDocument, DataroomFolder } from "@prisma/client";
import useSWR from "swr";

import { LinkWithViews } from "@/lib/types";
import { fetcher } from "@/lib/utils";
import { TrashItem } from "@/components/datarooms/trash/types";

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

  const shouldFetch = Boolean(teamId && id);

  const { data: dataroom, error } = useSWR<Dataroom>(
    shouldFetch ? `/api/teams/${teamId}/datarooms/${id}` : null,
    fetcher,
    { dedupingInterval: 10000 },
  );

  return {
    dataroom,
    loading: shouldFetch && !error && !dataroom,
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

  const shouldFetch = Boolean(teamId && id);

  const { data: links, error } = useSWR<LinkWithViews[]>(
    shouldFetch ? `/api/teams/${teamId}/datarooms/${id}/links` : null,
    fetcher,
    { dedupingInterval: 10000 },
  );

  return {
    links,
    loading: shouldFetch && !error && !links,
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

  const shouldFetch = Boolean(teamId && id && teamId !== 'undefined' && id !== 'undefined');
  const folderPath = root ? "?root=true" : name ? `/${name.join("/")}` : "";
  const documentsPath = name ? `/folders/documents/${name.join("/")}` : "/documents";

  const { data: folderData, error: folderError } = useSWR<DataroomFolderWithCount[]>(
    shouldFetch ? `/api/teams/${teamId}/datarooms/${id}/folders${folderPath}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );  

  console.log("folderData", folderData);

  const { data: documentData, error: documentError } = useSWR<DataroomFolderDocument[]>(
    shouldFetch ? `/api/teams/${teamId}/datarooms/${id}${documentsPath}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  const isLoading = shouldFetch && !folderData && !documentData && !folderError && !documentError;
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

export function useDataroomTrashItems({
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

  const { data: folderData, error: folderError } = useSWR<TrashItem[]>(
    teamId && id && teamId !== 'undefined' && id !== 'undefined' ?
      `/api/teams/${teamId}/datarooms/${id}/trash${root ? "?root=true" : name ? `/${name.join("/")}` : ""}` :
      null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  console.log("folderData", folderData);

  const documentCount = folderData?.filter(item => item.itemType === "DATAROOM_DOCUMENT").length || 0;
  const folderCount = folderData?.filter(item => item.itemType === "DATAROOM_FOLDER").length || 0;

  return {
    items: folderData,
    folderCount,
    documentCount,
    isLoading: !folderData && !folderError,
    error: folderError,
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
    teamId && id && teamId !== 'undefined' && id !== 'undefined' ?
      `/api/teams/${teamId}/datarooms/${id}/folders${root ? "?root=true" : name ? `/${name.join("/")}` : ""}` :
      null,
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
  trash,
}: {
  dataroomId: string;
  include_documents?: boolean;
    trash?: boolean;
}) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: folders, error } = useSWR<DataroomFolderWithDocuments[]>(
    (teamId && dataroomId && teamId !== 'undefined' && dataroomId !== 'undefined') ?
      (trash ?
        `/api/teams/${teamId}/datarooms/${dataroomId}/trash` :
        `/api/teams/${teamId}/datarooms/${dataroomId}/folders${include_documents ? "?include_documents=true" : ""}`) :
      null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );
  console.log("jsnonon", folders);

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

export function useDataroomTrashFolderWithParents({
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
    `/api/teams/${teamId}/datarooms/${dataroomId}/trash/parents/${name.join("/")}`,
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
    versions?: { id: string; hasPages: boolean }[];
    isExternalUpload?: boolean;
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

export function useDataroomVisits({
  dataroomId,
  groupId,
}: {
  dataroomId: string;
  groupId?: string;
}) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: views, error } = useSWR<any[]>(
    teamId &&
      dataroomId &&
      `/api/teams/${teamId}/datarooms/${dataroomId}${groupId ? `/groups/${groupId}` : ""}/views`,
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

type DataroomDocumentUploadViewHistory = {
  uploadedAt: string;
  documentId: string;
  originalFilename: string;
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

  const { data, error } = useSWR<{
    documentViews: DataroomDocumentViewHistory[];
    uploadedDocumentViews: DataroomDocumentUploadViewHistory[];
  }>(
    teamId &&
      dataroomId &&
      `/api/teams/${teamId}/datarooms/${dataroomId}/views/${viewId}/history`,
    fetcher,
    {
      dedupingInterval: 10000,
    },
  );

  return {
    documentViews: data?.documentViews,
    uploadedDocumentViews: data?.uploadedDocumentViews,
    loading: !error && !data,
    error,
  };
}
