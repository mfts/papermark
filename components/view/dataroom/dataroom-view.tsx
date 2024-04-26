import React, { useEffect, useRef, useState } from "react";
import AccessForm, {
  DEFAULT_ACCESS_FORM_DATA,
  DEFAULT_ACCESS_FORM_TYPE,
} from "@/components/view/access-form";
import { usePlausible } from "next-plausible";
import { toast } from "sonner";
import LoadingSpinner from "@/components/ui/loading-spinner";
import EmailVerificationMessage from "../email-verification-form";
import { ExtendedRecordMap } from "notion-types";

import { Brand, DataroomBrand } from "@prisma/client";
import { useRouter } from "next/router";
import { useAnalytics } from "@/lib/analytics";
import DataroomViewer from "../DataroomViewer";
import PagesViewer from "../PagesViewer";
import { LinkWithDataroom } from "@/pages/view/d/[linkId]";
import { NotionPage } from "@/components/NotionPage";

export type DEFAULT_DOCUMENT_VIEW_TYPE = {
  viewId: string;
  dataroomViewId?: string;
  file: string | null;
  pages: { file: string; pageNumber: string; embeddedLinks: string[] }[] | null;
  notionData: { recordMap: ExtendedRecordMap | null } | null;
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
  brand?: DataroomBrand;
  token?: string;
  verifiedEmail?: string;
}) {
  const { linkType, dataroom, emailProtected, password: linkPassword } = link;

  const plausible = usePlausible();
  const analytics = useAnalytics();
  const router = useRouter();

  const didMount = useRef<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewData, setViewData] = useState<DEFAULT_DOCUMENT_VIEW_TYPE>({
    viewId: "",
    file: null,
    pages: null,
    notionData: null,
  });
  const [data, setData] = useState<DEFAULT_ACCESS_FORM_TYPE>(
    DEFAULT_ACCESS_FORM_DATA,
  );
  const [verificationRequested, setVerificationRequested] =
    useState<boolean>(false);
  const [documentData, setDocumentData] = useState<{
    id: string;
    name: string;
    hasPages: boolean;
    documentType: "pdf" | "notion";
    documentVersionId: string;
    documentVersionNumber: number;
  } | null>(null);

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
        email: data.email || verifiedEmail || userEmail,
        linkId: link.id,
        documentId: documentData?.id,
        documentName: documentData?.name,
        // ownerId: documentData?.ownerId,
        userId: userId || null,
        documentVersionId: documentData?.documentVersionId,
        hasPages: documentData?.hasPages,
        token: token || null,
        verifiedEmail: verifiedEmail || null,
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
        const { viewId, file, pages, notionData } =
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
          viewerEmail: data.email || verifiedEmail || userEmail,
        });
        setViewData((prev) => ({
          viewId,
          dataroomViewId:
            viewType === "DATAROOM_VIEW" ? viewId : prev.dataroomViewId,
          file,
          pages,
          notionData,
        }));
        setSubmitted(true);
        setVerificationRequested(false);
        setIsLoading(false);
      }
    } else {
      const { message } = await response.json();
      toast.error(message);
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
    console.log("viewData", viewData);
    if (!didMount.current) {
      if ((!submitted && !isProtected) || token || viewData.dataroomViewId) {
        handleSubmission();
      }
      didMount.current = true;
    }
  }, [submitted, isProtected, token, viewData.dataroomViewId]);

  useEffect(() => {
    console.log("documentData", documentData);
    // Ensure we're not running this logic on initial mount, but only when `documentData` changes thereafter
    if (didMount.current) {
      if (documentData !== null) {
        // Call handleSubmission or any other logic that needs to run when a document is selected
        handleSubmission();
      }
    }

    setViewData((prev) => ({
      ...prev,
      pages: null,
      file: null,
      viewId: "",
      notionData: null,
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
        isLoading={isLoading}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
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
    ) : viewData.pages ? (
      <div className="bg-gray-950">
        <PagesViewer
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
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-950">
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner className="h-20 w-20" />
      </div>
    </div>
  );
}
