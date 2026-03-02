import { GetServerSidePropsContext } from "next";
import { NextApiRequest } from "next";

import z from "zod";

import { verifyDataroomSessionInPagesRouter } from "@/lib/auth/dataroom-auth";

import ViewPage, {
  DomainViewPageProps,
  getStaticProps as getBaseStaticProps,
} from "../index";

type DomainFolderViewPageProps = DomainViewPageProps & {
  initialFolderId: string;
  hasServerValidatedSession: boolean;
};

type BaseDomainViewPageProps = DomainViewPageProps;

type DataroomLinkPayload = {
  id: string;
  dataroom: {
    id: string;
    folders: Array<{ id: string }>;
  };
};

export async function getServerSideProps(
  context: GetServerSidePropsContext,
): Promise<{ props: DomainFolderViewPageProps } | { notFound: true }> {
  const {
    domain: domainParam,
    slug: slugParam,
    folderId: folderIdParam,
  } = context.params as {
    domain: string;
    slug: string;
    folderId: string;
  };

  try {
    const domain = z.string().parse(domainParam);
    const slug = z.string().parse(slugParam);
    const folderId = z.string().cuid().parse(folderIdParam);

    const staticResult = await getBaseStaticProps({
      params: { domain, slug },
    } as any);

    if (!staticResult || ("notFound" in staticResult && staticResult.notFound)) {
      return { notFound: true };
    }

    if (!("props" in staticResult)) {
      return { notFound: true };
    }

    const baseProps = (await Promise.resolve(
      staticResult.props,
    )) as BaseDomainViewPageProps;

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

export default function DomainDataroomFolderViewPage(
  props: DomainFolderViewPageProps,
) {
  return <ViewPage {...props} />;
}
