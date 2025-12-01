import { useRouter } from "next/router";

import React, { useEffect, useRef, useState } from "react";

import { Brand } from "@prisma/client";
import Cookies from "js-cookie";
import { usePlausible } from "next-plausible";
import { ExtendedRecordMap } from "notion-types";
import { toast } from "sonner";

import { useAnalytics } from "@/lib/analytics";
import { useDisablePrint } from "@/lib/hooks/use-disable-print";
import { LinkWithDocument, NotionTheme, WatermarkConfig } from "@/lib/types";

import LoadingSpinner from "@/components/ui/loading-spinner";
import AccessForm, {
  DEFAULT_ACCESS_FORM_DATA,
  DEFAULT_ACCESS_FORM_TYPE,
} from "@/components/view/access-form";

import EmailVerificationMessage from "./access-form/email-verification-form";
import LinkPreview from "./link-preview";
import { TNavData } from "./nav";
import ViewData, { TViewDocumentData } from "./view-data";

type RowData = { [key: string]: any };
type SheetData = {
  sheetName: string;
  columnData: string[];
  rowData: RowData[];
};

export type DEFAULT_DOCUMENT_VIEW_TYPE = {
  viewId?: string;
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
  fileType?: string;
  isPreview?: boolean;
  ipAddress?: string;
  verificationToken?: string;
  isTeamMember?: boolean;
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
  showAccountCreationSlide,
  useAdvancedExcelViewer,
  previewToken,
  disableEditEmail,
  useCustomAccessForm,
  logoOnAccessForm,
  isEmbedded,
  annotationsEnabled,
}: {
  link: LinkWithDocument;
  userEmail: string | null | undefined;
  userId: string | null | undefined;
  isProtected: boolean;
  notionData?: {
    rootNotionPageId: string | null;
    recordMap: ExtendedRecordMap | null;
    theme: NotionTheme | null;
  };
  brand?: Partial<Brand> | null;
  token?: string;
  verifiedEmail?: string;
  showPoweredByBanner?: boolean;
  showAccountCreationSlide?: boolean;
  useAdvancedExcelViewer?: boolean;
  previewToken?: string;
  disableEditEmail?: boolean;
  useCustomAccessForm?: boolean;
  isEmbedded?: boolean;
  logoOnAccessForm?: boolean;
  annotationsEnabled?: boolean;
}) {
  useDisablePrint();
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
  const [verificationToken, setVerificationToken] = useState<string | null>(
    token ?? null,
  );
  const [code, setCode] = useState<string | null>(null);
  const [isInvalidCode, setIsInvalidCode] = useState<boolean>(false);
  const [linkOpened, setLinkOpened] = useState<boolean>(false);

  // Check if this is a link document
  const isLinkDocument = document.type === "link";
  // For link documents, get URL from viewData.file (from API) or fallback to document.file
  const linkUrl = isLinkDocument 
    ? (viewData.file || document.file) 
    : null;

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
          sheetData,
          fileType,
          isPreview,
          ipAddress,
          verificationToken,
          isTeamMember,
        } = fetchData as DEFAULT_DOCUMENT_VIEW_TYPE;

        // For link documents, we don't track views here - only when the link is opened
        if (!isLinkDocument) {
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
            isEmbedded,
            isTeamMember,
            teamId: link.teamId,
          });
        }

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

        setViewData({
          viewId,
          file,
          pages,
          sheetData,
          fileType,
          isPreview,
          ipAddress,
          isTeamMember,
        });
        setSubmitted(true);
        setVerificationRequested(false);
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
      if ((!submitted && !isProtected) || token || previewToken) {
        handleSubmission();
      }
      didMount.current = true;
    }
  }, [submitted, isProtected, token, previewToken]);

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
        brand={brand}
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
        agreementContentType={link.agreement?.contentType}
        requireName={link.agreement?.requireName}
        isLoading={isLoading}
        brand={brand}
        disableEditEmail={disableEditEmail}
        useCustomAccessForm={useCustomAccessForm}
        customFields={link.customFields}
        logoOnAccessForm={logoOnAccessForm}
        linkWelcomeMessage={link.welcomeMessage}
      />
    );
  }

  const handleLinkContinue = async () => {
    // Use viewData.file or fallback to document.file
    const finalLinkUrl = linkUrl || document.file;
    if (!finalLinkUrl) {
      console.error("Link URL not available", { linkUrl, documentFile: document.file, viewDataFile: viewData.file });
      return;
    }

    // Track link open in analytics and record 100% completion (non-blocking)
    if (viewData.viewId) {
      // Record page view for page 1 to mark 100% completion
      fetch("/api/record_view", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          linkId: link.id,
          documentId: document.id,
          viewId: viewData.viewId,
          pageNumber: 1,
          versionNumber: document.versions[0].versionNumber,
          duration: 1000, // 1 second minimum duration
          time: Date.now(),
        }),
        keepalive: true,
      }).catch((error) => {
        console.error("Failed to record page view:", error);
      });

      // Track link open
      fetch("/api/record_link_open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          linkId: link.id,
          documentId: document.id,
          viewId: viewData.viewId,
          linkUrl: finalLinkUrl,
          viewerEmail: data.email ?? verifiedEmail ?? userEmail ?? undefined,
        }),
      }).catch((error) => {
        console.error("Failed to track link open:", error);
      });

      plausible("linkOpened");
      analytics.capture("Link Opened", {
        linkId: link.id,
        documentId: document.id,
        linkType: "DOCUMENT_LINK",
        viewerId: viewData.viewId,
        viewerEmail: data.email ?? verifiedEmail ?? userEmail,
        teamId: link.teamId,
      });
    }

    // Open link in new window/tab immediately
    setLinkOpened(true);
    const newWindow = window.open(finalLinkUrl, "_blank", "noopener,noreferrer");
    if (!newWindow) {
      // If popup blocked, fallback to current window
      window.location.href = finalLinkUrl;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner className="h-20 w-20" />
      </div>
    );
  }

  // For link documents, show the preview page
  if (submitted && isLinkDocument) {
    const navData: TNavData = {
      linkId: link.id,
      documentId: document.id,
      viewId: viewData.viewId,
      isPreview: viewData.isPreview || false,
      allowDownload: link.allowDownload || false,
      brand: brand,
      annotationsFeatureEnabled: annotationsEnabled || false,
    };

    // Use viewData.file or fallback to document.file
    const finalLinkUrl = linkUrl || document.file || "";

    return (
      <div
        className="bg-gray-950"
        style={{
          backgroundColor:
            brand && brand.accentColor ? brand.accentColor : "rgb(3, 7, 18)",
        }}
      >
        <LinkPreview
          linkUrl={finalLinkUrl}
          linkName={document.name}
          brand={brand}
          onContinue={handleLinkContinue}
          navData={navData}
        />
      </div>
    );
  }

  return (
    <div
      className="bg-gray-950"
      style={{
        backgroundColor:
          brand && brand.accentColor ? brand.accentColor : "rgb(3, 7, 18)",
      }}
    >
      {submitted ? (
        <ViewData
          link={link}
          viewData={viewData}
          document={document as unknown as TViewDocumentData}
          notionData={notionData}
          brand={brand}
          showPoweredByBanner={showPoweredByBanner}
          showAccountCreationSlide={showAccountCreationSlide}
          useAdvancedExcelViewer={useAdvancedExcelViewer}
          viewerEmail={data.email ?? verifiedEmail ?? userEmail ?? undefined}
          annotationsEnabled={annotationsEnabled}
        />
      ) : (
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner className="h-20 w-20" />
        </div>
      )}
    </div>
  );
}
