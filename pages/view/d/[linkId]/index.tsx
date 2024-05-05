import LoadingSpinner from "@/components/ui/loading-spinner";
import NotFound from "@/pages/404";
import { useSession } from "next-auth/react";

import { CustomUser } from "@/lib/types";
import { GetStaticPropsContext } from "next";
import { useRouter } from "next/router";
import { Brand, DataroomBrand, DataroomFolder, Link } from "@prisma/client";
import CustomMetatag from "@/components/view/custom-metatag";
import Head from "next/head";
import DataroomView from "@/components/view/dataroom/dataroom-view";

export interface LinkWithDataroom extends Link {
  dataroom: {
    id: string;
    name: string;
    teamId: string;
    documents: {
      id: string;
      folderId: string | null;
      document: {
        id: string;
        name: string;
        versions: {
          id: string;
          versionNumber: number;
          type: string;
          hasPages: boolean;
          file: string;
        }[];
      };
    }[];
    folders: DataroomFolder[];
    lastUpdatedAt: Date;
  };
}

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const { linkId } = context.params as { linkId: string };

  // Fetch the link
  const res = await fetch(
    `${process.env.NEXTAUTH_URL}/api/links/${linkId}/dataroom`,
  );

  if (!res.ok) {
    return { notFound: true };
  }
  const { link, brand, lastUpdatedAt } = (await res.json()) as {
    link: LinkWithDataroom;
    brand: DataroomBrand | null;
    lastUpdatedAt: Date;
  };

  if (!link || !link.dataroom) {
    return {
      notFound: true,
    };
  }

  if (link.linkType === "DOCUMENT_LINK") {
    return {
      notFound: true,
    };
  }

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
      // return link without file and type to avoid sending the file to the client
      link: {
        ...link,
        dataroom: { ...link.dataroom, documents: documents, lastUpdatedAt },
      },
      meta: {
        enableCustomMetatag: link.enableCustomMetatag || false,
        metaTitle: link.metaTitle,
        metaDescription: link.metaDescription,
        metaImage: link.metaImage,
      },
      brand, // pass brand to the client
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
  meta,
  brand,
}: {
  link: LinkWithDataroom;
  meta: {
    enableCustomMetatag: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    metaImage: string | null;
  } | null;
  brand?: DataroomBrand;
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
          title={meta?.metaTitle ?? link?.dataroom.name ?? "Dataroom"}
          description={meta?.metaDescription ?? null}
          imageUrl={meta?.metaImage ?? null}
          url={`https://www.papermark.io/view/d/${router.query.linkId}`}
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
          title={metaTitle}
          description={metaDescription}
          imageUrl={metaImage}
          url={`https://www.papermark.io/view/d/${router.query.linkId}`}
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
        enableBranding={enableCustomMetatag ?? false}
        title={metaTitle}
        description={metaDescription}
        imageUrl={metaImage}
        url={`https://www.papermark.io/view/d/${router.query.linkId}`}
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
