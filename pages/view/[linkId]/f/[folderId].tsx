import { GetServerSidePropsContext } from "next";
import { NextApiRequest } from "next";

import z from "zod";

import { verifyDataroomSessionInPagesRouter } from "@/lib/auth/dataroom-auth";

import ViewPage, { ViewPageProps, getStaticProps as getBaseStaticProps } from "../index";

type FolderViewPageProps = ViewPageProps & {
  error?: boolean;
  notionError?: boolean;
  initialFolderId: string;
  hasServerValidatedSession: boolean;
};

type BaseViewPageProps = ViewPageProps & {
  error?: boolean;
  notionError?: boolean;
};

type DataroomLinkPayload = {
  id: string;
  dataroom: {
    id: string;
    folders: Array<{ id: string }>;
  };
};

export async function getServerSideProps(
  context: GetServerSidePropsContext,
): Promise<{ props: FolderViewPageProps } | { notFound: true }> {
  const { linkId: linkIdParam, folderId: folderIdParam } = context.params as {
    linkId: string;
    folderId: string;
  };

  try {
    const linkId = z.string().cuid().parse(linkIdParam);
    const folderId = z.string().cuid().parse(folderIdParam);

    const staticResult = await getBaseStaticProps({
      params: { linkId },
    } as any);

    if (!staticResult || ("notFound" in staticResult && staticResult.notFound)) {
      return { notFound: true };
    }

    if (!("props" in staticResult)) {
      return { notFound: true };
    }

    const baseProps = (await Promise.resolve(
      staticResult.props,
    )) as BaseViewPageProps;

    if (!baseProps.linkData || baseProps.linkData.linkType !== "DATAROOM_LINK") {
      return { notFound: true };
    }

    const dataroomLink = baseProps.linkData.link as DataroomLinkPayload;
    const dataroomId = dataroomLink?.dataroom?.id;
    const folderExists = Boolean(
      dataroomLink?.dataroom?.folders?.some(
        (folder) => folder.id === folderId,
      ),
    );

    if (!dataroomId || !folderExists) {
      return { notFound: true };
    }

    const dataroomSession = await verifyDataroomSessionInPagesRouter(
      context.req as NextApiRequest,
      dataroomLink.id,
      dataroomId,
    );

    return {
      props: {
        ...baseProps,
        initialFolderId: folderId,
        hasServerValidatedSession: !!dataroomSession,
      },
    };
  } catch {
    return { notFound: true };
  }
}

export default function DataroomFolderViewPage(props: FolderViewPageProps) {
  return <ViewPage {...props} />;
}
