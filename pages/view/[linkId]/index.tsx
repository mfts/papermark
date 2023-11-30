import LoadingSpinner from "@/components/ui/loading-spinner";
import DocumentView from "@/components/view/document-view";
import NotFound from "@/pages/404";
import { useSession } from "next-auth/react";
import prisma from "@/lib/prisma";

import { ExtendedRecordMap } from "notion-types";
import notion from "@/lib/notion";
import { LinkWithDocument } from "@/lib/types";
import { parsePageId } from "notion-utils";

export const getStaticProps = async (context: {
  params: { linkId: string };
}) => {
  const linkId = context.params.linkId as string;

  console.log("linkId", linkId);

  const link = await prisma.link.findUnique({
    where: {
      id: linkId,
    },
    select: {
      id: true,
      expiresAt: true,
      emailProtected: true,
      allowDownload: true,
      password: true,
      isArchived: true,
      document: {
        select: {
          id: true,
          versions: {
            where: { isPrimary: true },
            select: { versionNumber: true, type: true, file: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!link || !link.document) {
    return {
      notFound: true,
    };
  }

  let pageId = null;
  let recordMap = null;

  const { type, file, ...versionWithoutTypeAndFile } =
    link.document.versions[0];

  if (type === "notion") {
    const notionPageId = parsePageId(file, { uuid: false });
    if (!notionPageId) {
      return {
        notFound: true,
      };
    }

    pageId = notionPageId;
    recordMap = await notion.getPage(pageId);
  }

  return {
    props: {
      // return link without file and type to avoid sending the file to the client
      link: {
        ...link,
        document: {
          ...link.document,
          versions: [versionWithoutTypeAndFile],
        },
      },
      notionData: {
        rootNotionPageId: null, // do not pass rootNotionPageId to the client
        recordMap,
      },
    },
    revalidate: 10,
  };
};

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: true,
  };
}

export default function ViewPage({
  link,
  notionData,
}: {
  link: LinkWithDocument;
  notionData: {
    rootNotionPageId: string | null;
    recordMap: ExtendedRecordMap | null;
  };
}) {
  const { data: session, status } = useSession();

  if (!link || status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner className="h-20 w-20" />
      </div>
    );
  }

  const {
    expiresAt,
    emailProtected,
    password: linkPassword,
    isArchived,
  } = link;

  const { email: userEmail } = session?.user || {};

  // If the link is expired, show a 404 page
  if (expiresAt && new Date(expiresAt) < new Date()) {
    return (
      <NotFound message="Sorry, the link you're looking for is expired." />
    );
  }

  if (isArchived) {
    return (
      <NotFound message="Sorry, the link you're looking for is archived." />
    );
  }

  if (emailProtected || linkPassword) {
    return (
      <DocumentView
        link={link}
        userEmail={userEmail}
        isProtected={true}
        notionData={notionData}
      />
    );
  }

  return (
    <DocumentView
      link={link}
      userEmail={userEmail}
      isProtected={false}
      notionData={notionData}
    />
  );
}
