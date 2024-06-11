import { useRouter } from "next/router";

import React, { useEffect, useRef, useState } from "react";

import { Brand } from "@prisma/client";
import { usePlausible } from "next-plausible";
import { ExtendedRecordMap } from "notion-types";
import { toast } from "sonner";

import LoadingSpinner from "@/components/ui/loading-spinner";
import AccessForm, {
  DEFAULT_ACCESS_FORM_DATA,
  DEFAULT_ACCESS_FORM_TYPE,
} from "@/components/view/access-form";

import { useAnalytics } from "@/lib/analytics";
import { LinkWithDocument } from "@/lib/types";

import EmailVerificationMessage from "./email-verification-form";
import ViewData from "./view-data";

type RowData = { [key: string]: any };
type SheetData = {
  sheetName: string;
  columnData: string[];
  rowData: RowData[];
};

export type DEFAULT_DOCUMENT_VIEW_TYPE = {
  viewId: string;
  file?: string | null;
  pages?:
    | { file: string; pageNumber: string; embeddedLinks: string[] }[]
    | null;
  sheetData?: SheetData[] | null;
};

export default function DocumentView({
  link,
  userEmail,
  userId,
  isProtected,
  notionData,
  brand,
  token,
  verifiedEmail,
  showPoweredByBanner,
}: {
  link: LinkWithDocument;
  userEmail: string | null | undefined;
  userId: string | null | undefined;
  isProtected: boolean;
  notionData?: {
    rootNotionPageId: string | null;
    recordMap: ExtendedRecordMap | null;
  };
  brand?: Partial<Brand> | null;
  token?: string;
  verifiedEmail?: string;
  showPoweredByBanner?: boolean;
}) {
  const {
    document,
    emailProtected,
    password: linkPassword,
    enableAgreement,
  } = link;

  const plausible = usePlausible();
  const analytics = useAnalytics();
  const router = useRouter();

  const didMount = useRef<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewData, setViewData] = useState<DEFAULT_DOCUMENT_VIEW_TYPE>({
    viewId: "",
  });
  const [data, setData] = useState<DEFAULT_ACCESS_FORM_TYPE>(
    DEFAULT_ACCESS_FORM_DATA,
  );
  const [verificationRequested, setVerificationRequested] =
    useState<boolean>(false);

  const handleSubmission = async (): Promise<void> => {
    setIsLoading(true);
    const response = await fetch("/api/views", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        email: data.email ?? verifiedEmail ?? userEmail ?? null,
        linkId: link.id,
        documentId: document.id,
        documentName: document.name,
        ownerId: document.ownerId,
        userId: userId ?? null,
        documentVersionId: document.versions[0].id,
        hasPages: document.versions[0].hasPages,
        token: token ?? null,
        verifiedEmail: verifiedEmail ?? null,
      }),
    });

    if (response.ok) {
      const fetchData = await response.json();

      if (fetchData.type === "email-verification") {
        setVerificationRequested(true);
        setIsLoading(false);
      } else {
        const { viewId, file, pages, sheetData } =
          fetchData as DEFAULT_DOCUMENT_VIEW_TYPE;
        plausible("documentViewed"); // track the event
        analytics.identify(
          userEmail ?? verifiedEmail ?? data.email ?? undefined,
        );
        analytics.capture("Link Viewed", {
          linkId: link.id,
          documentId: document.id,
          linkType: "DOCUMENT_LINK",
          viewerId: viewId,
          viewerEmail: data.email ?? verifiedEmail ?? userEmail,
        });
        setViewData({ viewId, file, pages, sheetData });
        setSubmitted(true);
        setVerificationRequested(false);
        setIsLoading(false);
      }
    } else {
      const data = await response.json();
      toast.error(data.message);

      if (data.resetVerification) {
        const currentQuery = { ...router.query };
        delete currentQuery.token;
        delete currentQuery.email;

        router.replace(
          {
            pathname: router.pathname,
            query: currentQuery,
          },
          undefined,
          { shallow: true },
        );
      }
      setIsLoading(false);
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event: React.FormEvent,
  ): Promise<void> => {
    event.preventDefault();
    await handleSubmission();
  };

  // If token is present, run handle submit which will verify token and get document
  // If link is not submitted and does not have email / password protection, show the access form
  useEffect(() => {
    if (!didMount.current) {
      if ((!submitted && !isProtected) || token) {
        handleSubmission();
      }
      didMount.current = true;
    }
  }, [submitted, isProtected, token]);

  // Components to render when email is submitted but verification is pending
  if (verificationRequested) {
    return (
      <EmailVerificationMessage
        onSubmitHandler={handleSubmit}
        data={data}
        isLoading={isLoading}
      />
    );
  }

  // If link is not submitted and does not have email / password protection, show the access form
  if (!submitted && isProtected) {
    return (
      <AccessForm
        data={data}
        email={userEmail}
        setData={setData}
        onSubmitHandler={handleSubmit}
        requireEmail={emailProtected}
        requirePassword={!!linkPassword}
        requireAgreement={enableAgreement!}
        agreementContent={link.agreement?.content}
        isLoading={isLoading}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner className="h-20 w-20" />
      </div>
    );
  }
  return (
    <div className="bg-gray-950">
      {submitted ? (
        <ViewData
          link={link}
          viewData={viewData}
          notionData={notionData}
          brand={brand}
          showPoweredByBanner={showPoweredByBanner}
        />
      ) : (
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner className="h-20 w-20" />
        </div>
      )}
    </div>
  );
}
