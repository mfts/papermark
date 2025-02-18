import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import NotFound from "@/pages/404";

import LoadingSpinner from "@/components/ui/loading-spinner";
import DataroomView from "@/components/view/dataroom/dataroom-view";
import DocumentView from "@/components/view/document-view";

import { useAnalytics } from "@/lib/analytics";

import { ViewPageProps } from "./index";

// Reuse the same getStaticProps and getStaticPaths from the main view page
export { getStaticProps, getStaticPaths } from "./index";

export default function EmbedPage(props: ViewPageProps) {
  const router = useRouter();
  const [isEmbedded, setIsEmbedded] = useState<boolean | null>(null);
  const analytics = useAnalytics();

  useEffect(() => {
    // Only run when router is ready and linkId is present
    if (!router.isReady || !router.query.linkId) return;

    // Check if the page is embedded in an iframe
    const isInIframe = window !== window.parent;
    setIsEmbedded(isInIframe);

    if (isInIframe) {
      document.body.classList.add("embed-view");

      // Track embed view with referrer information
      const referrer = document.referrer;
      const embedSource = referrer ? new URL(referrer).hostname : "direct";

      analytics.capture("Embedded Link Loaded", {
        linkId: router.query.linkId as string,
        embedSource,
        url: referrer || "unknown",
        userAgent: window.navigator.userAgent,
      });

      return () => document.body.classList.remove("embed-view");
    }
  }, [router.isReady, router.query.linkId]);

  // Show loading state while checking
  if (isEmbedded === null || router.isFallback) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner className="h-20 w-20" />
      </div>
    );
  }

  // Block direct access
  if (!isEmbedded) {
    return (
      <NotFound message="This page can only be accessed when embedded in another website." />
    );
  }

  const {
    email: verifiedEmail,
    d: disableEditEmail,
    previewToken,
  } = router.query as {
    email: string;
    d: string;
    previewToken?: string;
  };
  const { linkType, link, brand } = props.linkData;

  // Render the document view for DOCUMENT_LINK
  if (linkType === "DOCUMENT_LINK") {
    if (!props.linkData || router.isFallback) {
      return (
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner className="h-20 w-20" />
        </div>
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
      <div className="h-screen w-full overflow-hidden">
        <DocumentView
          link={link}
          userEmail={verifiedEmail}
          userId={null}
          isProtected={!!(emailProtected || linkPassword || enableAgreement)}
          notionData={props.notionData}
          brand={brand}
          showPoweredByBanner={props.showPoweredByBanner}
          showAccountCreationSlide={props.showAccountCreationSlide}
          useAdvancedExcelViewer={props.useAdvancedExcelViewer}
          previewToken={previewToken}
          disableEditEmail={!!disableEditEmail}
          useCustomAccessForm={props.useCustomAccessForm}
          verifiedEmail={verifiedEmail}
          isEmbedded
        />
      </div>
    );
  }

  // Render the dataroom view for DATAROOM_LINK
  if (linkType === "DATAROOM_LINK") {
    if (!link || router.isFallback) {
      return (
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner className="h-20 w-20" />
        </div>
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
      <div className="h-screen w-full overflow-hidden">
        <DataroomView
          link={link}
          userEmail={verifiedEmail}
          userId={null}
          isProtected={!!(emailProtected || linkPassword || enableAgreement)}
          brand={brand}
          previewToken={previewToken}
          disableEditEmail={!!disableEditEmail}
          useCustomAccessForm={props.useCustomAccessForm}
          verifiedEmail={verifiedEmail}
          isEmbedded
        />
      </div>
    );
  }
}
