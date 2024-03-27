import { type NextRouter, useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { Dataroom, DataroomDocument, DataroomFolder } from "@prisma/client";
import { useTeam } from "@/context/team-context";
import { LinkWithViews } from "@/lib/types";

export type DataroomFolderWithCount = DataroomFolder & {
  _count: {
    documents: number;
    childFolders: number;
  };
};

function getBaseInfo(): {
  teamId: string | undefined;
  id: string | undefined;
  router: NextRouter;
} {
  const router = useRouter();

  const { id } = router.query as {
    id: string;
  };

  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  return { teamId, id, router };
}

export function useDataroom() {
  const { teamId, id } = getBaseInfo();

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
  const { teamId, id } = getBaseInfo();

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

export function useDataroomDocuments() {
  const { teamId, id } = getBaseInfo();

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
  const { teamId, id } = getBaseInfo();

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

export type DRFolderWithDocuments = DataroomFolder & {
  childFolders: DRFolderWithDocuments[];
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

export function useDataroomFoldersTree({ dataroomId }: { dataroomId: string }) {
  const { teamId } = getBaseInfo();

  const { data: folders, error } = useSWR<DRFolderWithDocuments[]>(
    teamId && `/api/teams/${teamId}/datarooms/${dataroomId}/folders`,
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
  const { teamId } = getBaseInfo();

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
  const { teamId, id } = getBaseInfo();

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
