import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import React, { useEffect, useRef, useState } from "react";

import { DataroomBrand } from "@prisma/client";
import { usePlausible } from "next-plausible";
import { ExtendedRecordMap } from "notion-types";
import { toast } from "sonner";

import { NotionPage } from "@/components/NotionPage";
import LoadingSpinner from "@/components/ui/loading-spinner";
import AccessForm, {
  DEFAULT_ACCESS_FORM_DATA,
  DEFAULT_ACCESS_FORM_TYPE,
} from "@/components/view/access-form";

import { useAnalytics } from "@/lib/analytics";
import { LinkWithDataroom } from "@/lib/types";

import DataroomViewer from "../DataroomViewer";
import PagesViewerNew from "../PagesViewerNew";
import EmailVerificationMessage from "../email-verification-form";

const ExcelViewer = dynamic(
  () => import("@/components/view/viewer/excel-viewer"),
  { ssr: false },
);

type RowData = { [key: string]: any };
type SheetData = {
  sheetName: string;
  columnData: string[];
  rowData: RowData[];
};

export type TDocumentData = {
  id: string;
  name: string;
  hasPages: boolean;
  documentType: "pdf" | "notion" | "sheet";
  documentVersionId: string;
  documentVersionNumber: number;
  isVertical?: boolean;
};

export type DEFAULT_DOCUMENT_VIEW_TYPE = {
  viewId: string;
  dataroomViewId?: string;
  file?: string | null;
  pages?:
    | { file: string; pageNumber: string; embeddedLinks: string[] }[]
    | null;
  sheetData?: SheetData[] | null;
  notionData?: { recordMap: ExtendedRecordMap | null };
};

export default function DataroomView({
  link,
  userEmail,
  userId,
  isProtected,
  brand,
  token,
  verifiedEmail,
}: {
  link: LinkWithDataroom;
  userEmail: string | null | undefined;
  userId: string | null | undefined;
  isProtected: boolean;
  brand?: Partial<DataroomBrand> | null;
  token?: string;
  verifiedEmail?: string;
}) {
  const {
    linkType,
    dataroom,
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
  const [dataroomVerified, setDataroomVerified] = useState<boolean>(false);
  const [documentData, setDocumentData] = useState<TDocumentData | null>(null);

  const [viewType, setViewType] = useState<"DOCUMENT_VIEW" | "DATAROOM_VIEW">(
    "DATAROOM_VIEW",
  );

  const handleSubmission = async (): Promise<void> => {
    setIsLoading(true);
    const response = await fetch("/api/views-dataroom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        email: data.email ?? verifiedEmail ?? userEmail ?? null,
        linkId: link.id,
        documentId: documentData?.id,
        documentName: documentData?.name,
        userId: userId ?? null,
        documentVersionId: documentData?.documentVersionId,
        hasPages: documentData?.hasPages,
        token: token ?? null,
        verifiedEmail: verifiedEmail ?? null,
        dataroomVerified: dataroomVerified,
        dataroomId: dataroom?.id,
        linkType: linkType,
        dataroomViewId: viewData.dataroomViewId ?? null,
        viewType: viewType,
      }),
    });

    if (response.ok) {
      const fetchData = await response.json();

      if (fetchData.type === "email-verification") {
        setVerificationRequested(true);
        setIsLoading(false);
      } else {
        const { viewId, file, pages, notionData, sheetData } =
          fetchData as DEFAULT_DOCUMENT_VIEW_TYPE;
        plausible("dataroomViewed"); // track the event
        analytics.identify(
          userEmail ?? verifiedEmail ?? data.email ?? undefined,
        );
        analytics.capture("Link Viewed", {
          linkId: link.id,
          documentId: documentData?.id,
          dataroomId: dataroom?.id,
          linkType: linkType,
          viewerId: viewId,
          viewerEmail: data.email ?? verifiedEmail ?? userEmail,
        });
        setViewData((prev) => ({
          viewId,
          dataroomViewId:
            viewType === "DATAROOM_VIEW" ? viewId : prev.dataroomViewId,
          file,
          pages,
          notionData,
          sheetData,
        }));
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
      if ((!submitted && !isProtected) || token || viewData.dataroomViewId) {
        handleSubmission();
      }
      didMount.current = true;
    }
  }, [submitted, isProtected, token, viewData.dataroomViewId]);

  useEffect(() => {
    // Ensure we're not running this logic on initial mount, but only when `documentData` changes thereafter
    if (didMount.current) {
      if (documentData !== null) {
        // Call handleSubmission or any other logic that needs to run when a document is selected
        handleSubmission();
      }
    }

    setViewData((prev) => ({
      ...prev,
      pages: undefined,
      file: undefined,
      viewId: "",
      notionData: undefined,
    }));
    // This effect is specifically for handling changes to `documentData` post-mount
  }, [documentData]);

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

  if (submitted && documentData) {
    return viewData.notionData?.recordMap ? (
      <div className="bg-gray-950">
        <NotionPage
          recordMap={viewData.notionData.recordMap}
          viewId={viewData.viewId}
          linkId={link.id}
          documentId={documentData.id}
          documentName={documentData.name}
          versionNumber={documentData.documentVersionNumber}
          brand={brand}
          dataroomId={dataroom.id}
          setDocumentData={setDocumentData}
        />
      </div>
    ) : viewData.sheetData ? (
      <div className="bg-gray-950">
        <ExcelViewer
          linkId={link.id}
          viewId={viewData.viewId}
          documentId={documentData.id}
          documentName={documentData.name}
          versionNumber={documentData.documentVersionNumber}
          sheetData={viewData.sheetData}
          brand={brand}
          dataroomId={dataroom.id}
          setDocumentData={setDocumentData}
        />
      </div>
    ) : viewData.pages ? (
      <div className="bg-gray-950">
        <PagesViewerNew
          pages={viewData.pages}
          viewId={viewData.viewId}
          linkId={link.id}
          documentId={documentData.id}
          documentName={documentData.name}
          allowDownload={link.allowDownload!}
          feedbackEnabled={link.enableFeedback!}
          screenshotProtectionEnabled={link.enableScreenshotProtection!}
          versionNumber={documentData.documentVersionNumber}
          brand={brand}
          dataroomId={dataroom.id}
          setDocumentData={setDocumentData}
          isVertical={documentData.isVertical}
        />
      </div>
    ) : null;
  }

  if (submitted && !documentData) {
    return (
      <div className="bg-gray-950">
        <DataroomViewer
          brand={brand!}
          viewId={viewData.viewId}
          dataroomViewId={viewData.dataroomViewId!}
          dataroom={dataroom}
          setDocumentData={setDocumentData}
          setViewType={setViewType}
          setDataroomVerified={setDataroomVerified}
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-950">
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner className="h-20 w-20" />
      </div>
    </div>
  );
}
