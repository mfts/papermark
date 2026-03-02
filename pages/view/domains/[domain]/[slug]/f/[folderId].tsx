import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import NotFound from "@/pages/404";
import { DataroomBrand } from "@prisma/client";
import Cookies from "js-cookie";
import { useSession } from "next-auth/react";
import z from "zod";

import { fetchLinkDataByDomainSlug } from "@/lib/api/links/link-data";
import { verifyDataroomSessionInPagesRouter } from "@/lib/auth/dataroom-auth";
import { getFeatureFlags } from "@/lib/featureFlags";
import prisma from "@/lib/prisma";
import { CustomUser, LinkWithDataroom } from "@/lib/types";

import LoadingSpinner from "@/components/ui/loading-spinner";
import CustomMetaTag from "@/components/view/custom-metatag";
import DataroomView from "@/components/view/dataroom/dataroom-view";

type DataroomLinkData = {
  linkType: "DATAROOM_LINK";
  link: LinkWithDataroom;
  brand: DataroomBrand | null;
};

type PreValidatedSession = {
  viewId: string;
  viewerEmail?: string;
  viewerId?: string;
  conversationsEnabled?: boolean;
  enableVisitorUpload?: boolean;
  isTeamMember?: boolean;
  agentsEnabled?: boolean;
  dataroomName?: string;
};

type FolderPageProps = {
  linkData: DataroomLinkData;
  meta: {
    enableCustomMetatag: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    metaImage: string | null;
    metaFavicon: string;
    metaUrl: string;
  };
  useCustomAccessForm: boolean;
  logoOnAccessForm: boolean;
  dataroomIndexEnabled?: boolean;
  textSelectionEnabled?: boolean;
  initialFolderId: string;
  preValidatedSession: PreValidatedSession | null;
  error?: boolean;
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
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
    const domain = z
      .string()
      .regex(/^([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/)
      .parse(domainParam);
    const slug = z
      .string()
      .regex(/^[a-zA-Z0-9_-]+$/, "Invalid path parameter")
      .parse(slugParam);
    const folderId = z.string().cuid().parse(folderIdParam);

    const result = await fetchLinkDataByDomainSlug({ domain, slug });
    if (result.status !== "ok") {
      return { notFound: true };
    }

    const { linkType, link, brand } = result;
    if (!link || linkType !== "DATAROOM_LINK") {
      return { notFound: true };
    }

    const folderExists = link.dataroom.folders.some(
      (f: any) => f.id === folderId,
    );
    if (!folderExists) {
      return { notFound: true };
    }

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
              document.updatedAt > updatedAt ? document.updatedAt : updatedAt,
          },
        ],
      };

      documents.push(newDocument);
    }

    const { teamId } = link.dataroom;
    const featureFlags = await getFeatureFlags({ teamId });
    const dataroomIndexEnabled = featureFlags.dataroomIndex;
    const textSelectionEnabled = featureFlags.textSelection;

    const lastUpdatedAt = link.dataroom.documents.reduce(
      (max: number, doc: any) => {
        return Math.max(
          max,
          new Date(doc.document.versions[0].updatedAt).getTime(),
        );
      },
      new Date(link.dataroom.createdAt).getTime(),
    );

    // Server-side session validation using the link ID
    const linkId = link.id;
    let preValidatedSession: PreValidatedSession | null = null;
    const dataroomSession = await verifyDataroomSessionInPagesRouter(
      context.req as any,
      linkId,
      link.dataroomId!,
    );

    if (dataroomSession) {
      const [viewer, linkConfig] = await Promise.all([
        dataroomSession.viewerId
          ? prisma.viewer.findUnique({
              where: { id: dataroomSession.viewerId },
              select: { email: true },
            })
          : null,
        prisma.link.findUnique({
          where: { id: linkId },
          select: {
            enableConversation: true,
            enableUpload: true,
            dataroom: { select: { agentsEnabled: true, name: true } },
          },
        }),
      ]);

      preValidatedSession = {
        viewId: dataroomSession.viewId,
        viewerId: dataroomSession.viewerId,
        viewerEmail: viewer?.email ?? undefined,
        conversationsEnabled: linkConfig?.enableConversation ?? undefined,
        enableVisitorUpload: linkConfig?.enableUpload ?? undefined,
        agentsEnabled: linkConfig?.dataroom?.agentsEnabled ?? false,
        dataroomName: linkConfig?.dataroom?.name ?? undefined,
      };
    }

    return {
      props: {
        linkData: {
          linkType: "DATAROOM_LINK",
          link: {
            ...link,
            teamId: teamId || null,
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
          metaFavicon: link.metaFavicon || "/favicon.ico",
          metaUrl: `https://${domain}/${slug}`,
        },
        useCustomAccessForm: [
          "cm0154tiv0000lr2t6nr5c6kp",
          "clup33by90000oewh4rfvp2eg",
          "cm76hfyvy0002q623hmen99pf",
          "cm9ztf0s70005js04i689gefn",
          "cmk2hnmqh0000k304zcoezt6n",
        ].includes(teamId),
        logoOnAccessForm: [
          "cm7nlkrhm0000qgh0nvyrrywr",
          "clup33by90000oewh4rfvp2eg",
        ].includes(teamId),
        dataroomIndexEnabled,
        textSelectionEnabled,
        initialFolderId: folderId,
        preValidatedSession,
      },
    };
  } catch (error) {
    console.error(
      "Fetching error:",
      error instanceof Error ? error.message : String(error),
    );
    return { props: { error: true } };
  }
}

export default function FolderViewPage({
  linkData,
  meta,
  useCustomAccessForm,
  logoOnAccessForm,
  dataroomIndexEnabled,
  textSelectionEnabled,
  initialFolderId,
  preValidatedSession,
  error,
}: FolderPageProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [storedToken, setStoredToken] = useState<string | undefined>(undefined);
  const [storedEmail, setStoredEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    const cookieToken = Cookies.get(`pm_drs_flag_${router.query.slug}`);
    const storedEmail = window.localStorage.getItem("papermark.email");
    if (cookieToken) {
      setStoredToken(cookieToken);
      if (storedEmail) {
        setStoredEmail(storedEmail.toLowerCase());
      }
    }
  }, [router.query.slug]);

  if (error) {
    return (
      <NotFound message="Sorry, we had trouble loading this link. Please try again in a moment." />
    );
  }

  if (!linkData) {
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

  const { link, brand } = linkData;

  if (!link || status === "loading") {
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
    password: linkPassword,
    enableAgreement,
    isArchived,
  } = link;

  const { email: userEmail, id: userId } = (session?.user as CustomUser) || {};

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
        userId={userId}
        isProtected={!!(emailProtected || linkPassword || enableAgreement)}
        brand={brand}
        disableEditEmail={!!disableEditEmail}
        useCustomAccessForm={useCustomAccessForm}
        logoOnAccessForm={logoOnAccessForm}
        token={storedToken}
        verifiedEmail={verifiedEmail}
        previewToken={previewToken}
        preview={!!preview}
        dataroomIndexEnabled={dataroomIndexEnabled}
        textSelectionEnabled={textSelectionEnabled}
        initialFolderId={initialFolderId}
        preValidatedSession={preValidatedSession}
      />
    </>
  );
}
