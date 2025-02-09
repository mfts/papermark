import { useRouter } from "next/router";

import { useEffect, useRef, useState } from "react";
import React from "react";

import { Brand, DataroomBrand } from "@prisma/client";
import { toast } from "sonner";

import { WatermarkConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/utils/use-media-query";

import { ScreenProtector } from "../ScreenProtection";
import { TDocumentData } from "../dataroom/dataroom-view";
import Nav from "../nav";
import { PoweredBy } from "../powered-by";
import { ScreenShield } from "../screen-shield";
import { SVGWatermark } from "../watermark-svg";

const trackPageView = async (data: {
  linkId: string;
  documentId: string;
  viewId?: string;
  duration: number;
  pageNumber: number;
  versionNumber: number;
  dataroomId?: string;
  isPreview?: boolean;
}) => {
  // If the view is a preview, do not track the view
  if (data.isPreview) return;

  await fetch("/api/record_view", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export default function ImageViewer({
  file,
  linkId,
  documentId,
  viewId,
  assistantEnabled,
  allowDownload,
  feedbackEnabled,
  screenshotProtectionEnabled,
  screenShieldPercentage,
  versionNumber,
  brand,
  documentName,
  dataroomId,
  setDocumentData,
  showPoweredByBanner,
  showAccountCreationSlide,
  enableQuestion = false,
  feedback,
  viewerEmail,
  isPreview,
  watermarkConfig,
  ipAddress,
  linkName,
}: {
  file: string;
  linkId: string;
  documentId: string;
  viewId?: string;
  assistantEnabled?: boolean;
  allowDownload: boolean;
  feedbackEnabled: boolean;
  screenshotProtectionEnabled: boolean;
  screenShieldPercentage: number | null;
  versionNumber: number;
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
  documentName?: string;
  dataroomId?: string;
  setDocumentData?: React.Dispatch<React.SetStateAction<TDocumentData | null>>;
  showPoweredByBanner?: boolean;
  showAccountCreationSlide?: boolean;
  enableQuestion?: boolean | null;
  feedback?: {
    id: string;
    data: { question: string; type: string };
  } | null;
  viewerEmail?: string;
  isPreview?: boolean;
  watermarkConfig?: WatermarkConfig | null;
  ipAddress?: string;
  linkName?: string;
}) {
  const router = useRouter();

  const numPages = 1;

  const [pageNumber, setPageNumber] = useState<number>(1); // start on first page

  const [scale, setScale] = useState<number>(1);
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  const startTimeRef = useRef(Date.now());
  const visibilityRef = useRef<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<HTMLImageElement | null>(null);

  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const { isMobile } = useMediaQuery();

  // Add zoom handlers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3)); // Max zoom 3x
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5)); // Min zoom 0.5x
  };

  // Add keyboard shortcuts for zooming
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === "-") {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === "0") {
          e.preventDefault();
          setScale(1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [containerRef.current, imageDimensions]);

  useEffect(() => {
    const updateImageDimensions = () => {
      let newDimensions: { width: number; height: number } | null = null;

      if (imageRefs.current) {
        newDimensions = {
          width: imageRefs.current.clientWidth,
          height: imageRefs.current.clientHeight,
        };
      }
      setImageDimensions(newDimensions);
    };

    updateImageDimensions();
    window.addEventListener("resize", updateImageDimensions);

    return () => {
      window.removeEventListener("resize", updateImageDimensions);
    };
  }, [pageNumber]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (pageNumber > numPages) return;

      if (document.visibilityState === "visible") {
        visibilityRef.current = true;
        startTimeRef.current = Date.now(); // Reset start time when the page becomes visible again
      } else {
        visibilityRef.current = false;
        if (pageNumber <= numPages) {
          const duration = Date.now() - startTimeRef.current;
          trackPageView({
            linkId,
            documentId,
            viewId,
            duration,
            pageNumber: pageNumber,
            versionNumber,
            dataroomId,
            isPreview,
          });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pageNumber, numPages]);

  useEffect(() => {
    startTimeRef.current = Date.now();

    if (visibilityRef.current && pageNumber <= numPages) {
      const duration = Date.now() - startTimeRef.current;
      trackPageView({
        linkId,
        documentId,
        viewId,
        duration,
        pageNumber: pageNumber,
        versionNumber,
        dataroomId,
        isPreview,
      });
    }
  }, [pageNumber, numPages]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pageNumber <= numPages) {
        const duration = Date.now() - startTimeRef.current;
        trackPageView({
          linkId,
          documentId,
          viewId,
          duration,
          pageNumber: pageNumber,
          versionNumber,
          dataroomId,
          isPreview,
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pageNumber, numPages]);

  // Add this effect near your other useEffect hooks
  useEffect(() => {
    if (!screenshotProtectionEnabled) return;

    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [screenshotProtectionEnabled]);

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

    if (!dataroomId && router.query.token) {
      removeQueryParams(["token", "email", "domain", "slug", "linkId"]);
    }
  }, []); // Run once on mount

  // Function to handle context for screenshotting
  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!screenshotProtectionEnabled && !screenShieldPercentage) {
      return null;
    }

    event.preventDefault();
    // Close menu on click anywhere
    const clickHandler = () => {
      document.removeEventListener("click", clickHandler);
    };
    document.addEventListener("click", clickHandler);

    toast.info("Context menu has been disabled.");
  };

  return (
    <>
      <Nav
        pageNumber={pageNumber}
        numPages={numPages}
        allowDownload={allowDownload}
        brand={brand}
        viewId={viewId}
        linkId={linkId}
        documentId={documentId}
        documentName={documentName}
        isDataroom={!!dataroomId}
        setDocumentData={setDocumentData}
        isMobile={isMobile}
        isPreview={isPreview}
        hasWatermark={!!watermarkConfig}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
      />
      <div
        style={{ height: "calc(100dvh - 64px)" }}
        className="relative flex items-center overflow-hidden"
      >
        <div
          className={cn(
            "relative h-full w-full",
            !isWindowFocused &&
              screenshotProtectionEnabled &&
              "blur-xl transition-all duration-300",
          )}
          ref={containerRef}
        >
          <div className={cn("h-full w-full", scale > 1 && "overflow-auto")}>
            <div
              className="flex min-h-full w-full items-center justify-center"
              style={{
                transform: `scale(${scale})`,
                transition: "transform 0.2s ease-out",
                transformOrigin: scale <= 1 ? "center center" : "left top",
                minWidth: scale > 1 ? `${100 * scale}%` : "100%",
              }}
              onContextMenu={handleContextMenu}
            >
              <div className="relative my-auto flex w-full justify-center">
                <img
                  className="!pointer-events-auto max-h-[calc(100dvh-64px)] object-contain"
                  ref={(ref) => {
                    imageRefs.current = ref;
                    if (ref) {
                      ref.onload = () =>
                        setImageDimensions({
                          width: ref.clientWidth,
                          height: ref.clientHeight,
                        });
                    }
                  }}
                  src={file}
                  alt="Image 1"
                />

                {/* Add Watermark Component */}
                {watermarkConfig ? (
                  <SVGWatermark
                    config={watermarkConfig}
                    viewerData={{
                      email: viewerEmail,
                      date: new Date().toLocaleDateString(),
                      time: new Date().toLocaleTimeString(),
                      link: linkName,
                      ipAddress: ipAddress,
                    }}
                    documentDimensions={
                      imageDimensions ?? { width: 0, height: 0 }
                    }
                    pageIndex={0}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {!!screenShieldPercentage ? (
          <ScreenShield visiblePercentage={screenShieldPercentage} />
        ) : null}
        {screenshotProtectionEnabled ? <ScreenProtector /> : null}
        {showPoweredByBanner ? <PoweredBy linkId={linkId} /> : null}
      </div>
    </>
  );
}
