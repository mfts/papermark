import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import React, { useEffect, useRef, useState } from "react";

import { DataroomBrand } from "@prisma/client";
import Cookies from "js-cookie";
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
import { SUPPORTED_DOCUMENT_SIMPLE_TYPES } from "@/lib/constants";
import { LinkWithDataroom, NotionTheme, WatermarkConfig } from "@/lib/types";

import DataroomViewer from "../DataroomViewer";
import PagesViewerNew from "../PagesViewerNew";
import EmailVerificationMessage from "../email-verification-form";
import AdvancedExcelViewer from "../viewer/advanced-excel-viewer";
import DownloadOnlyViewer from "../viewer/download-only-viewer";
import ImageViewer from "../viewer/image-viewer";

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

export type TSupportedDocumentSimpleType =
  (typeof SUPPORTED_DOCUMENT_SIMPLE_TYPES)[number];

export type TDocumentData = {
  id: string;
  name: string;
  hasPages: boolean;
  documentType: TSupportedDocumentSimpleType;
  documentVersionId: string;
  documentVersionNumber: number;
  downloadOnly: boolean;
  isVertical?: boolean;
};

export type DEFAULT_DOCUMENT_VIEW_TYPE = {
  viewId?: string;
  isPreview?: boolean;
  dataroomViewId?: string;
  file?: string | null;
  pages?:
    | {
        file: string;
        pageNumber: string;
        embeddedLinks: string[];
        pageLinks: { href: string; coords: string }[];
        metadata: { width: number; height: number; scaleFactor: number };
      }[]
    | null;
  sheetData?: SheetData[] | null;
  notionData?: {
    recordMap: ExtendedRecordMap | null;
    theme: NotionTheme | null | undefined;
  };
  fileType?: string;
  ipAddress?: string;
  useAdvancedExcelViewer?: boolean;
  canDownload?: boolean;
  verificationToken?: string;
};

export default function DataroomView({
  link,
  userEmail,
  userId,
  isProtected,
  brand,
  token,
  verifiedEmail,
  useAdvancedExcelViewer,
  previewToken,
  disableEditEmail,
  useCustomAccessForm,
  isEmbedded,
}: {
  link: LinkWithDataroom;
  userEmail: string | null | undefined;
  userId: string | null | undefined;
  isProtected: boolean;
  brand?: Partial<DataroomBrand> | null;
  token?: string;
  verifiedEmail?: string;
  useAdvancedExcelViewer?: boolean;
  previewToken?: string;
  disableEditEmail?: boolean;
  useCustomAccessForm?: boolean;
  isEmbedded?: boolean;
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
  const [folderId, setFolderId] = useState<string | null>(null);

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
  const [verificationToken, setVerificationToken] = useState<string | null>(
    token ?? null,
  );

  const [code, setCode] = useState<string | null>(null);
  const [isInvalidCode, setIsInvalidCode] = useState<boolean>(false);

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
        dataroomVerified: dataroomVerified,
        dataroomId: dataroom?.id,
        linkType: linkType,
        dataroomViewId: viewData.dataroomViewId ?? null,
        viewType: viewType,
        useAdvancedExcelViewer,
        previewToken,
        code: code ?? undefined,
        token: verificationToken ?? undefined,
        verifiedEmail: verifiedEmail ?? undefined,
      }),
    });

    if (response.ok) {
      const fetchData = await response.json();

      if (fetchData.type === "email-verification") {
        setVerificationRequested(true);
        setIsLoading(false);
      } else {
        const {
          viewId,
          file,
          pages,
          notionData,
          sheetData,
          fileType,
          isPreview,
          ipAddress,
          useAdvancedExcelViewer,
          canDownload,
          verificationToken,
        } = fetchData as DEFAULT_DOCUMENT_VIEW_TYPE;
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
          isEmbedded,
        });

        // set the verification token to the cookie
        if (verificationToken) {
          Cookies.set("pm_vft", verificationToken, {
            path: router.asPath.split("?")[0],
            expires: 1,
            sameSite: "strict",
            secure: true,
          });
          setCode(null);
        }

        setViewData((prev) => ({
          viewId,
          dataroomViewId:
            viewType === "DATAROOM_VIEW" ? viewId : prev.dataroomViewId,
          file,
          pages,
          notionData,
          sheetData,
          fileType,
          isPreview,
          ipAddress,
          useAdvancedExcelViewer,
          canDownload,
        }));
        setSubmitted(true);
        setVerificationRequested(false);
        viewType === "DATAROOM_VIEW" && setDataroomVerified(true);
        setIsLoading(false);
      }
    } else {
      const data = await response.json();
      toast.error(data.message);

      if (data.resetVerification) {
        const currentPath = router.asPath.split("?")[0];

        Cookies.remove("pm_vft", { path: currentPath });
        setVerificationToken(null);
        setCode(null);
        setIsInvalidCode(true);
        setDataroomVerified(false);
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
      viewId: prev.dataroomViewId,
      notionData: undefined,
      ipAddress: undefined,
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
        code={code}
        setCode={setCode}
        isInvalidCode={isInvalidCode}
        setIsInvalidCode={setIsInvalidCode}
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
        agreementName={link.agreement?.name}
        agreementContent={link.agreement?.content}
        requireName={link.agreement?.requireName}
        isLoading={isLoading}
        disableEditEmail={disableEditEmail}
        useCustomAccessForm={useCustomAccessForm}
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
          isPreview={viewData.isPreview}
          linkId={link.id}
          documentId={documentData.id}
          documentName={documentData.name}
          versionNumber={documentData.documentVersionNumber}
          brand={brand}
          dataroomId={dataroom.id}
          theme={viewData.notionData.theme}
          setDocumentData={setDocumentData}
          screenshotProtectionEnabled={link.enableScreenshotProtection!}
        />
      </div>
    ) : documentData?.downloadOnly ? (
      <DownloadOnlyViewer
        file={viewData.file!}
        linkId={link.id}
        documentId={documentData.id}
        viewId={viewData.viewId}
        allowDownload={true}
        versionNumber={documentData.documentVersionNumber}
        brand={brand}
        documentName={documentData.name}
        isPreview={viewData.isPreview}
        dataroomId={dataroom.id}
        setDocumentData={setDocumentData}
      />
    ) : viewData.fileType === "sheet" && viewData.sheetData ? (
      <div className="bg-gray-950">
        <ExcelViewer
          linkId={link.id}
          viewId={viewData.viewId}
          isPreview={viewData.isPreview}
          documentId={documentData.id}
          documentName={documentData.name}
          versionNumber={documentData.documentVersionNumber}
          sheetData={viewData.sheetData}
          brand={brand}
          dataroomId={dataroom.id}
          setDocumentData={setDocumentData}
          allowDownload={viewData.canDownload ?? link.allowDownload!}
          screenshotProtectionEnabled={link.enableScreenshotProtection!}
        />
      </div>
    ) : viewData.fileType === "sheet" && viewData.useAdvancedExcelViewer ? (
      <div className="bg-gray-950">
        <AdvancedExcelViewer
          linkId={link.id}
          viewId={viewData.viewId}
          isPreview={viewData.isPreview}
          documentId={documentData.id}
          documentName={documentData.name}
          versionNumber={documentData.documentVersionNumber}
          file={viewData.file!}
          allowDownload={viewData.canDownload ?? link.allowDownload!}
          brand={brand}
          dataroomId={dataroom.id}
          setDocumentData={setDocumentData}
        />
      </div>
    ) : viewData.fileType === "image" ? (
      <div className="bg-gray-950">
        <ImageViewer
          file={viewData.file!}
          linkId={link.id}
          viewId={viewData.viewId}
          isPreview={viewData.isPreview}
          documentId={documentData.id}
          documentName={documentData.name}
          allowDownload={viewData.canDownload ?? link.allowDownload!}
          feedbackEnabled={link.enableFeedback!}
          screenshotProtectionEnabled={link.enableScreenshotProtection!}
          screenShieldPercentage={link.screenShieldPercentage}
          versionNumber={documentData.documentVersionNumber}
          brand={brand}
          dataroomId={dataroom.id}
          setDocumentData={setDocumentData}
          viewerEmail={data.email ?? verifiedEmail ?? userEmail ?? undefined}
          watermarkConfig={
            link.enableWatermark
              ? (link.watermarkConfig as WatermarkConfig)
              : null
          }
          ipAddress={viewData.ipAddress}
          linkName={link.name ?? `Link #${link.id.slice(-5)}`}
        />
      </div>
    ) : viewData.pages ? (
      <div className="bg-gray-950">
        <PagesViewerNew
          pages={viewData.pages}
          viewId={viewData.viewId}
          isPreview={viewData.isPreview}
          linkId={link.id}
          documentId={documentData.id}
          documentName={documentData.name}
          allowDownload={viewData.canDownload ?? link.allowDownload!}
          feedbackEnabled={link.enableFeedback!}
          screenshotProtectionEnabled={link.enableScreenshotProtection!}
          screenShieldPercentage={link.screenShieldPercentage}
          versionNumber={documentData.documentVersionNumber}
          brand={brand}
          dataroomId={dataroom.id}
          setDocumentData={setDocumentData}
          isVertical={documentData.isVertical}
          viewerEmail={data.email ?? verifiedEmail ?? userEmail ?? undefined}
          watermarkConfig={
            link.enableWatermark
              ? (link.watermarkConfig as WatermarkConfig)
              : null
          }
          ipAddress={viewData.ipAddress}
          linkName={link.name ?? `Link #${link.id.slice(-5)}`}
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
          isPreview={viewData.isPreview}
          linkId={link.id}
          dataroomViewId={viewData.dataroomViewId!}
          dataroom={dataroom}
          allowDownload={link.allowDownload!}
          setDocumentData={setDocumentData}
          setViewType={setViewType}
          setDataroomVerified={setDataroomVerified}
          folderId={folderId}
          setFolderId={setFolderId}
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
