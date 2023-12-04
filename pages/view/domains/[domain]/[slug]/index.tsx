import LoadingSpinner from "@/components/ui/loading-spinner";
import DocumentView from "@/components/view/document-view";
import { useDomainLink } from "@/lib/swr/use-link";
import { CustomUser, LinkWithDocument } from "@/lib/types";
import NotFound from "@/pages/404";
import { GetStaticPropsContext } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import prisma from "@/lib/prisma";

import { ExtendedRecordMap } from "notion-types";
import notion from "@/lib/notion";
import { parsePageId } from "notion-utils";

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const { domain, slug } = context.params as { domain: string; slug: string };

  // Fetch the link
  const res = await fetch(
    `${process.env.NEXTAUTH_URL}/api/links/domains/${encodeURIComponent(
      domain,
    )}/${encodeURIComponent(slug)}`,
  );
  if (!res.ok) {
    return { notFound: true };
  }
  const link = (await res.json()) as LinkWithDocument;

  let pageId = null;
  let recordMap = null;

  const { type, file, ...versionWithoutTypeAndFile } =
    link.document.versions[0];

  if (type === "notion") {
    // regex match to get the page id from the notion url
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
        rootNotionPageId: pageId,
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
  const router = useRouter();
  const { data: session, status } = useSession();

  if (!link || status === "loading" || router.isFallback) {
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

  const { email: userEmail, id: userId } = (session?.user as CustomUser) || {};

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
        userId={userId}
        isProtected={true}
        notionData={notionData}
      />
    );
  }

  return (
    <DocumentView
      link={link}
      userEmail={userEmail}
      userId={userId}
      isProtected={false}
      notionData={notionData}
    />
  );
}
