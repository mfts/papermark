import { GetStaticPropsContext } from "next";
import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import NotFound from "@/pages/404";
import { Brand, DataroomBrand, Link } from "@prisma/client";
import Cookies from "js-cookie";
import { useSession } from "next-auth/react";
import { ExtendedRecordMap } from "notion-types";
import { parsePageId } from "notion-utils";

import LoadingSpinner from "@/components/ui/loading-spinner";
import CustomMetaTag from "@/components/view/custom-metatag";
import DataroomView from "@/components/view/dataroom/dataroom-view";
import DocumentView from "@/components/view/document-view";
import RequestFileView from "@/components/view/request-file-view";

import notion from "@/lib/notion";
import { addSignedUrls } from "@/lib/notion/utils";
import {
  CustomUser,
  LinkWithDataroom,
  LinkWithDocument,
  LinkWithRequestFile,
  NotionTheme,
} from "@/lib/types";

type DocumentLinkData = {
  linkType: "DOCUMENT_LINK";
  link: LinkWithDocument;
  brand: Brand | null;
};

type RequestFileLinkData = {
  linkType: "FILE_REQUEST_LINK";
  link: LinkWithRequestFile;
  brand: Brand | null;
};

type DataroomLinkData = {
  linkType: "DATAROOM_LINK";
  link: LinkWithDataroom;
  brand: DataroomBrand | null;
};

export interface ViewPageProps {
  linkData: DocumentLinkData | DataroomLinkData | RequestFileLinkData;
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
}

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const { linkId } = context.params as { linkId: string };

  try {
    // fetch the link
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/links/${linkId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }
    const { linkType, link, brand } = (await res.json()) as
      | DocumentLinkData
      | DataroomLinkData
      | RequestFileLinkData;

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
        theme = new URL(file).searchParams.get("mode");
        const notionPageId = parsePageId(file, { uuid: false });
        if (!notionPageId) {
          return {
            notFound: true,
          };
        }

        pageId = notionPageId;
        recordMap = await notion.getPage(pageId, { signFileUrls: false });
        // TODO: separately sign the file urls until PR merged and published; ref: https://github.com/NotionX/react-notion-x/issues/580#issuecomment-2542823817
        await addSignedUrls({ recordMap });
      }

      const { team, teamId, advancedExcelEnabled, ...linkDocument } =
        link.document;
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
            teamId === "cm76hfyvy0002q623hmen99pf",
        },
        revalidate: brand || recordMap ? 10 : false,
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
          orderIndex: document.orderIndex,
          versions: [versionWithoutTypeAndFile],
        };

        documents.push(newDocument);
      }

      const { teamId } = link.dataroom;

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
            metaFavicon: link.metaFavicon ?? "/favicon.ico",
            metaUrl: `https://www.papermark.com/view/${linkId}`,
          },
          showPoweredByBanner: false,
          showAccountCreationSlide: false,
          useAdvancedExcelViewer: false, // INFO: this is managed in the API route
          useCustomAccessForm:
            teamId === "cm0154tiv0000lr2t6nr5c6kp" ||
            teamId === "clup33by90000oewh4rfvp2eg",
        },
        revalidate: 10,
      };
    }

    if (linkType === "FILE_REQUEST_LINK") {
      return {
        props: {
          linkData: {
            linkType: "FILE_REQUEST_LINK",
            link,
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
          showPoweredByBanner: link.showBanner || link.team.plan === "free",
          showAccountCreationSlide:
            link.showBanner || link.team.plan === "free",
          useAdvancedExcelViewer: false,
          useCustomAccessForm: false,
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
  showPoweredByBanner,
  showAccountCreationSlide,
  useAdvancedExcelViewer,
  useCustomAccessForm,
}: ViewPageProps) {
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
          token={storedToken}
          verifiedEmail={verifiedEmail}
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
          userEmail={verifiedEmail ?? storedEmail ?? userEmail}
          verifiedEmail={verifiedEmail}
          userId={userId}
          isProtected={!!(emailProtected || linkPassword || enableAgreement)}
          brand={brand}
          disableEditEmail={!!disableEditEmail}
          useCustomAccessForm={useCustomAccessForm}
          token={storedToken}
          previewToken={previewToken}
          preview={!!preview}
        />
      </>
    );
  }

  // Render the request file view for FILE_REQUEST_LINK
  if (linkType === "FILE_REQUEST_LINK") {
    if (!link || status === "loading" || router.isFallback) {
      return (
        <>
          <CustomMetaTag
            favicon={meta.metaFavicon}
            enableBranding={meta.enableCustomMetatag ?? false}
            // TODO: Update title
            title={
              meta.metaTitle ??
              `${link.name} | Powered by Papermark` ??
              "File upload request powered by Papermark"
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
      enableAgreement,
      isArchived,
    } = link;
    // If the link is expired, show a 404 page
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return (
        <NotFound message="Sorry, the link you're looking for is expired." />
      );
    }

    const { email: userEmail, id: userId } =
      (session?.user as CustomUser) || {};

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
          // TODO: Update Title
          title={
            meta.metaTitle ??
            `${link.name} | Powered by Papermark` ??
            "File upload request powered by Papermark"
          }
          description={meta.metaDescription ?? null}
          imageUrl={meta.metaImage ?? null}
          url={meta.metaUrl ?? ""}
        />
        <RequestFileView
          link={link}
          userEmail={verifiedEmail ?? storedEmail ?? userEmail}
          userId={userId}
          isProtected={!!(emailProtected || linkPassword || enableAgreement)}
          brand={brand}
          token={storedToken}
          verifiedEmail={verifiedEmail}
          disableEditEmail={!!disableEditEmail}
          useCustomAccessForm={useCustomAccessForm}
          previewToken={previewToken}
          preview={!!preview}
        />
      </>
    );
  }
}
