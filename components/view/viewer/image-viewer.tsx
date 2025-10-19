import { useRouter } from "next/router";

import { useEffect, useRef, useState } from "react";
import React from "react";

import { useSafePageViewTracker } from "@/lib/tracking/safe-page-view-tracker";
import { getTrackingOptions } from "@/lib/tracking/tracking-config";
import { WatermarkConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

import { ScreenProtector } from "../ScreenProtection";
import Nav, { TNavData } from "../nav";
import { PoweredBy } from "../powered-by";
import { SVGWatermark } from "../watermark-svg";
import { AwayPoster } from "./away-poster";

import "@/styles/custom-viewer-styles.css";

export default function ImageViewer({
  file,
  screenshotProtectionEnabled,
  versionNumber,
  showPoweredByBanner,
  viewerEmail,
  watermarkConfig,
  ipAddress,
  linkName,
  navData,
}: {
  file: string;
  screenshotProtectionEnabled: boolean;
  versionNumber: number;
  showPoweredByBanner?: boolean;
  viewerEmail?: string;
  watermarkConfig?: WatermarkConfig | null;
  ipAddress?: string;
  linkName?: string;
  navData: TNavData;
}) {
  const router = useRouter();

  const { isPreview, linkId, documentId, viewId, dataroomId } = navData;

  const numPages = 1;
  const pageNumber = 1;

  const [scale, setScale] = useState<number>(1);
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  const startTimeRef = useRef(Date.now());
  const visibilityRef = useRef<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<HTMLImageElement | null>(null);

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

  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

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
  }, [scale]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        visibilityRef.current = true;
        resetTrackingState();
        const trackingData = {
          linkId,
          documentId,
          viewId,
          pageNumber: pageNumber,
          versionNumber,
          dataroomId,
          isPreview,
        };
        startIntervalTracking(trackingData);
      } else {
        visibilityRef.current = false;
        stopIntervalTracking();
        const duration = getActiveDuration();
        trackPageViewSafely(
          {
            linkId,
            documentId,
            viewId,
            duration,
            pageNumber: pageNumber,
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
          pageNumber: pageNumber,
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

  // Start interval tracking when component mounts
  useEffect(() => {
    const trackingData = {
      linkId,
      documentId,
      viewId,
      pageNumber: pageNumber,
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

  return (
    <>
      <Nav
        pageNumber={pageNumber}
        numPages={numPages}
        hasWatermark={!!watermarkConfig}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        navData={navData}
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
          {/* Scroll Container */}
          <div className="h-full w-full overflow-auto">
            {/* Sizer defines scrollable dimensions at current scale */}
            <div
              className="mx-auto"
              style={{
                width:
                  imageDimensions && scale > 1
                    ? `${imageDimensions.width * scale}px`
                    : "100%",
                height:
                  imageDimensions && scale > 1
                    ? `${imageDimensions.height * scale}px`
                    : "auto",
              }}
            >
              {/* Scaled content */}
              <div
                style={{
                  transition: "transform 0.2s ease-out",
                  transformOrigin: "center top",
                  transform: `scale(${scale})`,
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <div className="viewer-container relative mx-auto flex w-full justify-center">
                  <img
                    className="viewer-image-mobile !pointer-events-auto max-h-[calc(100dvh-64px)] object-contain"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
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
        </div>

        {screenshotProtectionEnabled ? <ScreenProtector /> : null}
        {showPoweredByBanner ? <PoweredBy linkId={linkId} /> : null}
      </div>
      <AwayPoster
        isVisible={isInactive}
        inactivityThreshold={trackingOptions.inactivityThreshold || 60000}
        onDismiss={updateActivity}
      />
    </>
  );
}
