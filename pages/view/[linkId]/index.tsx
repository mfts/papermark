import { GetStaticPropsContext } from "next";
import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import NotFound from "@/pages/404";
import { Brand, DataroomBrand } from "@prisma/client";
import Cookies from "js-cookie";
import { useSession } from "next-auth/react";
import { ExtendedRecordMap } from "notion-types";
import { parsePageId } from "notion-utils";
import z from "zod";

import { getFeatureFlags } from "@/lib/featureFlags";
import notion from "@/lib/notion";
import { addSignedUrls } from "@/lib/notion/utils";
import {
  CustomUser,
  LinkWithDataroom,
  LinkWithDocument,
  NotionTheme,
} from "@/lib/types";

import LoadingSpinner from "@/components/ui/loading-spinner";
import CustomMetaTag from "@/components/view/custom-metatag";
import DataroomView from "@/components/view/dataroom/dataroom-view";
import DocumentView from "@/components/view/document-view";

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

export interface ViewPageProps {
  linkData: DocumentLinkData | DataroomLinkData;
  notionData: {
    rootNotionPageId: string | null;
    recordMap: ExtendedRecordMap | null;
    theme: NotionTheme | null;
  };
  meta: {
    enableCustomMetatag: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    metaImage: string | null;
    metaUrl: string | null;
    metaFavicon: string | null;
  };
  showPoweredByBanner: boolean;
  showAccountCreationSlide: boolean;
  useAdvancedExcelViewer: boolean;
  useCustomAccessForm: boolean;
  logoOnAccessForm: boolean;
  dataroomIndexEnabled?: boolean;
  annotationsEnabled?: boolean;
}

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const { linkId: linkIdParam } = context.params as { linkId: string };

  try {
    const linkId = z.string().cuid().parse(linkIdParam);
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/links/${linkId}`);
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
      let theme = null;

      const { type, file, ...versionWithoutTypeAndFile } =
        link.document.versions[0];

      if (type === "notion") {
        try {
          theme = new URL(file).searchParams.get("mode");
          const notionPageId = parsePageId(file, { uuid: false });
          if (!notionPageId) {
            return { notFound: true };
          }

          pageId = notionPageId;
          recordMap = await notion.getPage(pageId, { signFileUrls: false });
          await addSignedUrls({ recordMap });
        } catch (notionError) {
          console.error("Notion API error:", notionError);
          // Return a temporary error page instead of 404
          return {
            props: { notionError: true },
            revalidate: 30,
          };
        }
      }

      const { team, teamId, advancedExcelEnabled, ...linkDocument } =
        link.document;
      const teamPlan = team?.plan || "free";

      // Check feature flags for document links
      const featureFlags = await getFeatureFlags({ teamId });
      const annotationsEnabled = featureFlags.annotations;

      return {
        props: {
          linkData: {
            linkType: "DOCUMENT_LINK",
            link: {
              ...link,
              teamId: teamId,
              document: {
                ...linkDocument,
                versions: [versionWithoutTypeAndFile],
                // TODO: remove this once the assistant feature is re-enabled
                assistantEnabled: false,
              },
            },
            brand,
          },
          notionData: {
            rootNotionPageId: null, // do not pass rootNotionPageId to the client
            recordMap,
            theme,
          },
          meta: {
            enableCustomMetatag: link.enableCustomMetatag || false,
            metaTitle: link.metaTitle,
            metaDescription: link.metaDescription,
            metaImage: link.metaImage,
            metaFavicon: link.metaFavicon ?? "/favicon.ico",
            metaUrl: `https://www.papermark.com/view/${linkId}`,
          },
          showPoweredByBanner: link.showBanner || teamPlan === "free",
          showAccountCreationSlide: link.showBanner || teamPlan === "free",
          useAdvancedExcelViewer: advancedExcelEnabled,
          useCustomAccessForm:
            teamId === "cm0154tiv0000lr2t6nr5c6kp" ||
            teamId === "clup33by90000oewh4rfvp2eg" ||
            teamId === "cm76hfyvy0002q623hmen99pf" ||
            teamId === "cm9ztf0s70005js04i689gefn",
          logoOnAccessForm:
            teamId === "cm7nlkrhm0000qgh0nvyrrywr" ||
            teamId === "clup33by90000oewh4rfvp2eg",
          annotationsEnabled,
        },
        revalidate: brand || recordMap ? 10 : 60,
      };
    }

    // Manage the data for the dataroom link
    if (linkType === "DATAROOM_LINK") {
      // iterate the link.documents and extract type and file and rest of the props
      let documents = [];
      for (const document of link.dataroom.documents) {
        const { file, updatedAt, ...versionWithoutTypeAndFile } =
          document.document.versions[0];

        const newDocument = {
          ...document.document,
          dataroomDocumentId: document.id,
          folderId: document.folderId,
          orderIndex: document.orderIndex,
          hierarchicalIndex: document.hierarchicalIndex,
          versions: [
            {
              ...versionWithoutTypeAndFile,
              updatedAt:
                document.updatedAt > updatedAt ? document.updatedAt : updatedAt, // use the latest updatedAt
            },
          ],
        };

        documents.push(newDocument);
      }

      const { teamId } = link.dataroom;

      // Check feature flags
      const featureFlags = await getFeatureFlags({ teamId });
      const dataroomIndexEnabled = featureFlags.dataroomIndex;
      const annotationsEnabled = featureFlags.annotations;

      const lastUpdatedAt = link.dataroom.documents.reduce((max, doc) => {
        return Math.max(
          max,
          new Date(doc.document.versions[0].updatedAt).getTime(),
        );
      }, new Date(link.dataroom.createdAt).getTime());

      return {
        props: {
          linkData: {
            linkType: "DATAROOM_LINK",
            link: {
              ...link,
              teamId: teamId,
              dataroom: {
                ...link.dataroom,
                documents,
                lastUpdatedAt: lastUpdatedAt,
              },
            },
            brand,
          },
          meta: {
            enableCustomMetatag: link.enableCustomMetatag || false,
            metaTitle: link.metaTitle,
            metaDescription: link.metaDescription,
            metaImage: link.metaImage,
            metaFavicon: link.metaFavicon ?? "/favicon.ico",
            metaUrl: `https://www.papermark.com/view/${linkId}`,
          },
          showPoweredByBanner: false,
          showAccountCreationSlide: false,
          useAdvancedExcelViewer: false, // INFO: this is managed in the API route
          useCustomAccessForm:
            teamId === "cm0154tiv0000lr2t6nr5c6kp" ||
            teamId === "clup33by90000oewh4rfvp2eg" ||
            teamId === "cm76hfyvy0002q623hmen99pf" ||
            teamId === "cm9ztf0s70005js04i689gefn",
          logoOnAccessForm:
            teamId === "cm7nlkrhm0000qgh0nvyrrywr" ||
            teamId === "clup33by90000oewh4rfvp2eg",
          dataroomIndexEnabled,
          annotationsEnabled,
        },
        revalidate: 10,
      };
    }
  } catch (error) {
    console.error("Fetching error:", error);
    return { props: { error: true }, revalidate: 30 };
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
  showPoweredByBanner,
  showAccountCreationSlide,
  useAdvancedExcelViewer,
  useCustomAccessForm,
  logoOnAccessForm,
  dataroomIndexEnabled,
  annotationsEnabled,
  error,
  notionError,
}: ViewPageProps & { error?: boolean; notionError?: boolean }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [storedToken, setStoredToken] = useState<string | undefined>(undefined);
  const [storedEmail, setStoredEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Retrieve token from cookie on component mount
    const cookieToken =
      Cookies.get("pm_vft") ||
      Cookies.get(`pm_drs_flag_${router.query.linkId}`);
    const storedEmail = window.localStorage.getItem("papermark.email");
    if (cookieToken) {
      setStoredToken(cookieToken);
      if (storedEmail) {
        setStoredEmail(storedEmail.toLowerCase());
      }
    }
  }, [router.query.linkId]);

  if (router.isFallback) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <LoadingSpinner className="h-20 w-20" />
      </div>
    );
  }

  if (error) {
    return (
      <NotFound message="Sorry, we had trouble loading this link. Please try refreshing." />
    );
  }

  if (notionError) {
    return (
      <NotFound message="Sorry, we had trouble loading this link. Please try again in a moment." />
    );
  }

  const {
    email: verifiedEmail,
    d: disableEditEmail,
    previewToken,
    preview,
  } = router.query as {
    email: string;
    d: string;
    previewToken?: string;
    preview?: string;
  };
  const { linkType, link, brand } = linkData;

  // Render the document view for DOCUMENT_LINK
  if (linkType === "DOCUMENT_LINK") {
    if (!linkData || status === "loading" || router.isFallback) {
      return (
        <>
          <CustomMetaTag
            favicon={meta.metaFavicon}
            enableBranding={meta.enableCustomMetatag ?? false}
            title={
              meta.metaTitle ?? `${link?.document?.name} | Powered by Papermark`
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
      enableAgreement,
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

    return (
      <>
        <CustomMetaTag
          favicon={meta.metaFavicon}
          enableBranding={meta.enableCustomMetatag ?? false}
          title={
            meta.metaTitle ?? `${link?.document?.name} | Powered by Papermark`
          }
          description={meta.metaDescription ?? null}
          imageUrl={meta.metaImage ?? null}
          url={meta.metaUrl ?? ""}
        />
        <DocumentView
          link={link}
          userEmail={verifiedEmail ?? storedEmail ?? userEmail}
          userId={userId}
          isProtected={!!(emailProtected || linkPassword || enableAgreement)}
          notionData={notionData}
          brand={brand}
          showPoweredByBanner={showPoweredByBanner}
          showAccountCreationSlide={showAccountCreationSlide}
          useAdvancedExcelViewer={useAdvancedExcelViewer}
          previewToken={previewToken}
          disableEditEmail={!!disableEditEmail}
          useCustomAccessForm={useCustomAccessForm}
          logoOnAccessForm={logoOnAccessForm}
          token={storedToken}
          verifiedEmail={verifiedEmail}
          annotationsEnabled={annotationsEnabled}
        />
      </>
    );
  }

  // Render the dataroom view for DATAROOM_LINK
  if (linkType === "DATAROOM_LINK") {
    if (!link || status === "loading" || router.isFallback) {
      return (
        <>
          <CustomMetaTag
            favicon={meta.metaFavicon}
            enableBranding={meta.enableCustomMetatag ?? false}
            title={
              meta.metaTitle ?? `${link?.dataroom?.name} | Powered by Papermark`
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
      enableAgreement,
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

    return (
      <>
        <CustomMetaTag
          favicon={meta.metaFavicon}
          enableBranding={meta.enableCustomMetatag ?? false}
          title={
            meta.metaTitle ?? `${link?.dataroom?.name} | Powered by Papermark`
          }
          description={meta.metaDescription ?? null}
          imageUrl={meta.metaImage ?? null}
          url={meta.metaUrl ?? ""}
        />
        <DataroomView
          link={link}
          userEmail={verifiedEmail ?? storedEmail ?? userEmail}
          verifiedEmail={verifiedEmail}
          userId={userId}
          isProtected={!!(emailProtected || linkPassword || enableAgreement)}
          brand={brand}
          disableEditEmail={!!disableEditEmail}
          useCustomAccessForm={useCustomAccessForm}
          logoOnAccessForm={logoOnAccessForm}
          token={storedToken}
          previewToken={previewToken}
          preview={!!preview}
          dataroomIndexEnabled={dataroomIndexEnabled}
        />
      </>
    );
  }
}
