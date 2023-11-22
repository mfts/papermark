import LoadingSpinner from "@/components/ui/loading-spinner";
import DocumentView from "@/components/view/document-view";
import { useDomainLink } from "@/lib/swr/use-link";
import NotFound from "@/pages/404";
import { useSession } from "next-auth/react";
import prisma from "@/lib/prisma";

import { ExtendedRecordMap } from "notion-types";
import notion from "@/lib/notion";
import { LinkWithDocument } from "@/lib/types";
import { parsePageId } from "notion-utils";

export const getStaticProps = async (context: {
  params: { domain: string; slug: string };
}) => {
  const domain = context.params.domain as string;
  const slug = context.params.slug as string;

  console.log("domain", domain);
  console.log("slug", slug);

  const link = await prisma.link.findUnique({
    where: {
      domainSlug_slug: {
        slug: slug,
        domainSlug: domain,
      },
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
          team: { select: { plan: true } },
          versions: {
            where: { isPrimary: true },
            select: { versionNumber: true, type: true, file: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!link || !link.document.team) {
    return {
      notFound: true,
    };
  }

  console.log("plan", link.document.team.plan);

  // if owner of document is on free plan, return 404
  if (link.document.team.plan === "free") {
    return {
      notFound: true,
    };
  }

  let pageId = null;
  let recordMap = null;

  const { type, file, ...versionWithoutTypeAndFile } =
    link.document.versions[0];

  console.log("type", type);
  console.log("file", file);

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
