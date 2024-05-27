import { GetStaticPropsContext } from "next";
import { useRouter } from "next/router";

import NotFound from "@/pages/404";
import { Brand, DataroomBrand } from "@prisma/client";
import { useSession } from "next-auth/react";
import { ExtendedRecordMap } from "notion-types";
import { parsePageId } from "notion-utils";

import LoadingSpinner from "@/components/ui/loading-spinner";
import CustomMetatag from "@/components/view/custom-metatag";
import DataroomView from "@/components/view/dataroom/dataroom-view";
import DocumentView from "@/components/view/document-view";

import notion from "@/lib/notion";
import { CustomUser, LinkWithDataroom, LinkWithDocument } from "@/lib/types";

type DocumentLinkData = {
  linkType: "DOCUMENT_LINK";
  link: LinkWithDocument;
  brand: Brand | null;
};

type DataroomLinkData = {
  linkType: "DATAROOM_LINK";
  link: LinkWithDataroom;
  brand: DataroomBrand | null;
};

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const { domain, slug } = context.params as { domain: string; slug: string };

  try {
    // Fetch the link
    const res = await fetch(
      `${process.env.NEXTAUTH_URL}/api/links/domains/${encodeURIComponent(
        domain,
      )}/${encodeURIComponent(slug)}`,
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }
    const { linkType, link, brand } = (await res.json()) as
      | DocumentLinkData
      | DataroomLinkData;

    if (!link || !linkType) {
      return {
        notFound: true,
      };
    }

    // Manage the data for the document link
    if (linkType === "DOCUMENT_LINK") {
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
          linkData: {
            linkType: "DOCUMENT_LINK",
            link: {
              ...link,
              document: {
                ...linkDocument,
                versions: [versionWithoutTypeAndFile],
              },
            },
            brand,
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
            metaUrl: `https://${domain}/${slug}` || null,
          },
          showPoweredByBanner: teamPlan === "free",
        },
        revalidate: brand ? 10 : false,
      };
    }

    // Manage the data for the dataroom link
    if (linkType === "DATAROOM_LINK") {
      // iterate the link.documents and extract type and file and rest of the props
      let documents = [];
      for (const document of link.dataroom.documents) {
        const { file, ...versionWithoutTypeAndFile } =
          document.document.versions[0];

        const newDocument = {
          ...document.document,
          dataroomDocumentId: document.id,
          folderId: document.folderId,
          versions: [versionWithoutTypeAndFile],
        };

        documents.push(newDocument);
      }

      return {
        props: {
          linkData: {
            linkType: "DATAROOM_LINK",
            link: {
              ...link,
              dataroom: {
                ...link.dataroom,
                documents,
                lastUpdatedAt: null, // TODO: fix this to get the actual lastUpdatedAt
              },
            },
            brand,
          },
          meta: {
            enableCustomMetatag: link.enableCustomMetatag || false,
            metaTitle: link.metaTitle,
            metaDescription: link.metaDescription,
            metaImage: link.metaImage,
            metaUrl: `https://${domain}/${slug}` || null,
          },
          showPoweredByBanner: false,
        },
        revalidate: 10,
      };
    }
  } catch (error) {
    console.error("Fetching error:", error);
    return { notFound: true };
  }
};

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: true,
  };
}

export default function ViewPage({
  linkData,
  notionData,
  meta,
}: {
  linkData: DocumentLinkData | DataroomLinkData;
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
  };
}) {
  const router = useRouter();
  const { data: session, status } = useSession();

  if (router.isFallback) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <LoadingSpinner className="h-20 w-20" />
      </div>
    );
  }

  const { token, email: verifiedEmail } = router.query as {
    token: string;
    email: string;
  };
  const { linkType, link, brand } = linkData;

  // Render the document view for DOCUMENT_LINK
  if (linkType === "DOCUMENT_LINK") {
    if (!link || status === "loading") {
      return (
        <>
          <CustomMetatag
            enableBranding={meta.enableCustomMetatag ?? false}
            title={
              meta.metaTitle ??
              `${link?.document?.name} | Powered by Papermark` ??
              "Document powered by Papermark"
            }
            description={meta.metaDescription ?? null}
            imageUrl={meta.metaImage ?? null}
            url={meta.metaUrl ?? ""}
          />
          <div className="flex h-screen items-center justify-center">
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

    const { email: userEmail, id: userId } =
      (session?.user as CustomUser) || {};

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
        <>
          <CustomMetatag
            enableBranding={meta.enableCustomMetatag ?? false}
            title={
              meta.metaTitle ??
              `${link?.document?.name} | Powered by Papermark` ??
              "Document powered by Papermark"
            }
            description={meta.metaDescription ?? null}
            imageUrl={meta.metaImage ?? null}
            url={meta.metaUrl ?? ""}
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
          enableBranding={meta.enableCustomMetatag ?? false}
          title={
            meta.metaTitle ??
            `${link?.document?.name} | Powered by Papermark` ??
            "Document powered by Papermark"
          }
          description={meta.metaDescription ?? null}
          imageUrl={meta.metaImage ?? null}
          url={meta.metaUrl ?? ""}
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

  // Render the dataroom view for DATAROOM_LINK
  if (linkType === "DATAROOM_LINK") {
    if (!link || status === "loading" || router.isFallback) {
      return (
        <>
          <CustomMetatag
            enableBranding={meta.enableCustomMetatag ?? false}
            title={
              meta.metaTitle ??
              `${link?.dataroom?.name} | Powered by Papermark` ??
              "Dataroom powered by Papermark"
            }
            description={meta.metaDescription ?? null}
            imageUrl={meta.metaImage ?? null}
            url={meta.metaUrl ?? ""}
          />
          <div className="flex h-screen items-center justify-center">
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

    const { email: userEmail, id: userId } =
      (session?.user as CustomUser) || {};

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
        <>
          <CustomMetatag
            enableBranding={meta.enableCustomMetatag ?? false}
            title={
              meta.metaTitle ??
              `${link?.dataroom?.name} | Powered by Papermark` ??
              "Dataroom powered by Papermark"
            }
            description={meta.metaDescription ?? null}
            imageUrl={meta.metaImage ?? null}
            url={meta.metaUrl ?? ""}
          />
          <DataroomView
            link={link}
            userEmail={verifiedEmail ?? userEmail}
            userId={userId}
            isProtected={true}
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
          enableBranding={meta.enableCustomMetatag ?? false}
          title={
            meta.metaTitle ??
            `${link?.dataroom?.name} | Powered by Papermark` ??
            "Dataroom powered by Papermark"
          }
          description={meta.metaDescription ?? null}
          imageUrl={meta.metaImage ?? null}
          url={meta.metaUrl ?? ""}
        />
        <DataroomView
          link={link}
          userEmail={verifiedEmail ?? userEmail}
          userId={userId}
          isProtected={false}
          brand={brand}
        />
      </>
    );
  }
}
