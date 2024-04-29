import LoadingSpinner from "@/components/ui/loading-spinner";
import DocumentView from "@/components/view/document-view";
import NotFound from "@/pages/404";
import { useSession } from "next-auth/react";

import { ExtendedRecordMap } from "notion-types";
import notion from "@/lib/notion";
import { CustomUser, LinkWithDocument } from "@/lib/types";
import { parsePageId } from "notion-utils";
import { GetStaticPropsContext } from "next";
import { useRouter } from "next/router";
import { Brand } from "@prisma/client";
import CustomMetatag from "@/components/view/custom-metatag";
import Head from "next/head";

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const { linkId } = context.params as { linkId: string };

  // Fetch the link
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/links/${linkId}`);
  if (!res.ok) {
    return { notFound: true };
  }
  const { link, brand } = (await res.json()) as {
    link: LinkWithDocument;
    brand: Brand | null;
  };

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

  const { team, ...linkDocument } = link.document;
  const teamPlan = team?.plan || "free";

  return {
    props: {
      // return link without file and type to avoid sending the file to the client
      link: {
        ...link,
        document: {
          ...linkDocument,
          versions: [versionWithoutTypeAndFile],
        },
      },
      notionData: {
        rootNotionPageId: null, // do not pass rootNotionPageId to the client
        recordMap,
      },
      meta: {
        enableCustomMetatag: link.enableCustomMetatag || false,
        metaTitle: link.metaTitle,
        metaDescription: link.metaDescription,
        metaImage: link.metaImage,
      },
      brand, // pass brand to the client
      showPoweredByBanner: teamPlan === "free",
    },
    revalidate: brand ? 10 : false,
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
  showPoweredByBanner,
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
  } | null;
  brand?: Brand;
  showPoweredByBanner: boolean;
}) {
  const router = useRouter();
  const { token, email: verifiedEmail } = router.query as {
    token: string;
    email: string;
  };
  const { data: session, status } = useSession();

  if (!link || status === "loading" || router.isFallback) {
    return (
      <>
        <CustomMetatag
          enableBranding={meta?.enableCustomMetatag ?? false}
          title={
            meta?.metaTitle ?? link?.document?.name ?? "Papermark Document"
          }
          description={meta?.metaDescription ?? null}
          imageUrl={meta?.metaImage ?? null}
          url={`https://www.papermark.io/view/${router.query.linkId}`}
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
    emailAuthenticated,
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
          title={metaTitle ?? link.document.name}
          description={metaDescription}
          imageUrl={metaImage}
          url={`https://www.papermark.io/view/${router.query.linkId}`}
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
          showPoweredByBanner={showPoweredByBanner}
        />
      </>
    );
  }

  return (
    <>
      <CustomMetatag
        enableBranding={enableCustomMetatag ?? false}
        title={metaTitle ?? link.document.name}
        description={metaDescription}
        imageUrl={metaImage}
        url={`https://www.papermark.io/view/${router.query.linkId}`}
      />
      <DocumentView
        link={link}
        userEmail={verifiedEmail ?? userEmail}
        userId={userId}
        isProtected={false}
        notionData={notionData}
        brand={brand}
        showPoweredByBanner={showPoweredByBanner}
      />
    </>
  );
}
