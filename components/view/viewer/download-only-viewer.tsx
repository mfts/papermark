import { useRouter } from "next/router";

import { useEffect, useRef } from "react";

import { Download } from "lucide-react";
import { toast } from "sonner";

import { useSafePageViewTracker } from "@/lib/tracking/safe-page-view-tracker";
import { getTrackingOptions } from "@/lib/tracking/tracking-config";

import { Button } from "@/components/ui/button";

import { ScreenProtector } from "../ScreenProtection";
import Nav, { TNavData } from "../nav";
import { PoweredBy } from "../powered-by";
import { AwayPoster } from "./away-poster";

import "@/styles/custom-viewer-styles.css";

export default function DownloadOnlyViewer({
  versionNumber,
  documentName,
  navData,
}: {
  versionNumber: number;
  documentName?: string;
  navData: TNavData;
}) {
  const router = useRouter();
  const startTimeRef = useRef(Date.now());
  const visibilityRef = useRef<boolean>(true);

  const trackingOptions = getTrackingOptions();
  const {
    trackPageViewSafely,
    resetTrackingState,
    startIntervalTracking,
    stopIntervalTracking,
    getActiveDuration,
    isInactive,
    updateActivity,
  } = useSafePageViewTracker({
    ...trackingOptions,
    externalStartTimeRef: startTimeRef,
  });

  const { linkId, documentId, viewId, isPreview, allowDownload, dataroomId } =
    navData;

  useEffect(() => {
    // Remove token and email query parameters on component mount
    const removeQueryParams = (queries: string[]) => {
      const currentQuery = { ...router.query };
      const currentPath = router.asPath.split("?")[0];
      queries.map((query) => delete currentQuery[query]);

      router.replace(
        {
          pathname: currentPath,
          query: currentQuery,
        },
        undefined,
        { shallow: true },
      );
    };

    if (router.query.token) {
      removeQueryParams(["token", "email", "domain", "slug", "linkId"]);
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        visibilityRef.current = true;
        resetTrackingState();

        // Restart interval tracking
        const trackingData = {
          linkId,
          documentId,
          viewId,
          pageNumber: 1,
          versionNumber,
          dataroomId,
          isPreview,
        };
        startIntervalTracking(trackingData);
      } else {
        visibilityRef.current = false;
        stopIntervalTracking();

        // Track final duration using activity-aware calculation
        const duration = getActiveDuration();
        trackPageViewSafely(
          {
            linkId,
            documentId,
            viewId,
            duration,
            pageNumber: 1,
            versionNumber,
            dataroomId,
            isPreview,
          },
          true,
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    linkId,
    documentId,
    viewId,
    versionNumber,
    dataroomId,
    isPreview,
    trackPageViewSafely,
    resetTrackingState,
    startIntervalTracking,
    stopIntervalTracking,
    getActiveDuration,
  ]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      stopIntervalTracking();
      const duration = getActiveDuration();
      trackPageViewSafely(
        {
          linkId,
          documentId,
          viewId,
          duration,
          pageNumber: 1,
          versionNumber,
          dataroomId,
          isPreview,
        },
        true,
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    linkId,
    documentId,
    viewId,
    versionNumber,
    dataroomId,
    isPreview,
    trackPageViewSafely,
    stopIntervalTracking,
    getActiveDuration,
  ]);

  useEffect(() => {
    const trackingData = {
      linkId,
      documentId,
      viewId,
      pageNumber: 1,
      versionNumber,
      dataroomId,
      isPreview,
    };

    startIntervalTracking(trackingData);

    return () => {
      stopIntervalTracking();
    };
  }, [
    linkId,
    documentId,
    viewId,
    versionNumber,
    dataroomId,
    isPreview,
    startIntervalTracking,
    stopIntervalTracking,
  ]);

  const downloadFile = async () => {
    if (isPreview) {
      toast.error("You cannot download documents in preview mode.");
      return;
    }
    if (!allowDownload) return;

    const downloadPromise = (async () => {
      const response = await fetch(`/api/links/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ linkId, viewId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to download file";
        throw new Error(errorMessage);
      }

      // Check if the response is a PDF file (for watermarked PDFs)
      const contentType = response.headers.get("content-type");
      if (contentType === "application/pdf") {
        // Handle direct PDF download (watermarked PDFs)
        const pdfBlob = await response.blob();
        const url = URL.createObjectURL(pdfBlob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${documentName || "document"}.pdf`;
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();

        // Clean up
        setTimeout(() => {
          URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);
      } else {
        // Handle JSON response with downloadUrl (non-watermarked files)
        const { downloadUrl } = await response.json();
        window.open(downloadUrl, "_blank");
      }

      return "File downloaded successfully";
    })();

    toast.promise(downloadPromise, {
      loading: "Preparing download...",
      success: (message) => message,
      error: (err) => err.message || "Failed to download file",
    });
  };

  return (
    <>
      <Nav pageNumber={1} numPages={1} navData={navData} />
      <div
        style={{ height: "calc(100dvh - 64px)" }}
        className="relative flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900"
      >
        <div className="flex flex-col items-center space-y-6 p-8 text-center">
          <div className="rounded-full bg-gray-100 p-6 dark:bg-gray-800">
            <Download className="h-12 w-12 text-gray-600 dark:text-gray-300" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">
            {documentName || "Download Document"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This document is available for download only
          </p>
          {allowDownload && (
            <Button onClick={downloadFile} className="w-full space-x-2">
              <Download className="h-4 w-4" />
              <span>Download Now</span>
            </Button>
          )}
        </div>
      </div>
      <AwayPoster
        isVisible={isInactive}
        inactivityThreshold={trackingOptions.inactivityThreshold}
        onDismiss={updateActivity}
      />
    </>
  );
}
