import LoadingSpinner from "@/components/ui/loading-spinner";
import DocumentView from "@/components/view/document-view";
import { CustomUser, LinkWithDocument } from "@/lib/types";
import NotFound from "@/pages/404";
import { GetStaticPropsContext } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { ExtendedRecordMap } from "notion-types";
import notion from "@/lib/notion";
import { parsePageId } from "notion-utils";
import { Brand } from "@prisma/client";
import CustomMetatag from "@/components/view/custom-metatag";
import Head from "next/head";

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
  const { link, brand } = (await res.json()) as {
    link: LinkWithDocument;
    brand: Brand | null;
  };

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
      meta: {
        enableCustomMetatag: link.enableCustomMetatag || false,
        metaTitle: link.metaTitle,
        metaDescription: link.metaDescription,
        metaImage: link.metaImage,
        metaUrl: `https://${domain}/${slug}`,
      },
      brand, // pass the brand to client
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
  meta,
  brand,
}: {
  link: LinkWithDocument;
  notionData: {
    rootNotionPageId: string | null;
    recordMap: ExtendedRecordMap | null;
  };
  meta: {
    enableCustomMetatag: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    metaImage: string | null;
    metaUrl: string | null;
  } | null;
  brand?: Brand;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { token, email: verifiedEmail } = router.query as {
    token: string;
    email: string;
  };

  if (!link || status === "loading") {
    return (
      <>
        <CustomMetatag
          enableBranding={meta?.enableCustomMetatag ?? false}
          title={
            meta?.metaTitle ?? link?.document?.name ?? "Papermark Document"
          }
          description={meta?.metaDescription ?? null}
          imageUrl={meta?.metaImage ?? null}
          url={meta?.metaUrl ?? ""}
        />
        <div className="h-screen flex items-center justify-center">
          <LoadingSpinner className="h-20 w-20" />
        </div>
      </>
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

  const { enableCustomMetatag, metaTitle, metaDescription, metaImage } = link;

  if (emailProtected || linkPassword) {
    return (
      <>
        <CustomMetatag
          enableBranding={enableCustomMetatag ?? false}
          title={metaTitle}
          description={metaDescription}
          imageUrl={metaImage}
          url={meta?.metaUrl ?? ""}
        />
        <DocumentView
          link={link}
          userEmail={verifiedEmail ?? userEmail}
          userId={userId}
          isProtected={true}
          notionData={notionData}
          brand={brand}
          token={token}
          verifiedEmail={verifiedEmail}
        />
      </>
    );
  }

  return (
    <>
      <CustomMetatag
        enableBranding={enableCustomMetatag ?? false}
        title={metaTitle}
        description={metaDescription}
        imageUrl={metaImage}
        url={meta?.metaUrl ?? ""}
      />
      <DocumentView
        link={link}
        userEmail={verifiedEmail ?? userEmail}
        userId={userId}
        isProtected={false}
        notionData={notionData}
        brand={brand}
      />
    </>
  );
}
