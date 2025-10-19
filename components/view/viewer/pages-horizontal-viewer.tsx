import { useRouter } from "next/router";

import { useEffect, useRef, useState } from "react";
import React from "react";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import useSWR from "swr";

import { useViewerAnnotations } from "@/lib/swr/use-annotations";
import { useSafePageViewTracker } from "@/lib/tracking/safe-page-view-tracker";
import { getTrackingOptions } from "@/lib/tracking/tracking-config";
import { WatermarkConfig } from "@/lib/types";
import { cn, fetcher } from "@/lib/utils";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { ScreenProtector } from "../ScreenProtection";
import { AnnotationPanel } from "../annotations/annotation-panel";
import Nav, { TNavData } from "../nav";
import { PoweredBy } from "../powered-by";
import Question from "../question";
import Toolbar from "../toolbar";
import ViewDurationSummary from "../visitor-graph";
import { SVGWatermark } from "../watermark-svg";
import { AwayPoster } from "./away-poster";

import "@/styles/custom-viewer-styles.css";

const DEFAULT_PRELOADED_IMAGES_NUM = 5;

export default function PagesHorizontalViewer({
  pages,
  feedbackEnabled,
  screenshotProtectionEnabled,
  versionNumber,
  showPoweredByBanner,
  showAccountCreationSlide,
  enableQuestion = false,
  feedback,
  viewerEmail,
  watermarkConfig,
  ipAddress,
  linkName,
  navData,
}: {
  pages: {
    file: string;
    pageNumber: string;
    embeddedLinks: string[];
    pageLinks: { href: string; coords: string }[];
    metadata: { width: number; height: number; scaleFactor: number };
  }[];
  feedbackEnabled: boolean;
  screenshotProtectionEnabled: boolean;
  versionNumber: number;
  showPoweredByBanner?: boolean;
  showAccountCreationSlide?: boolean;
  enableQuestion?: boolean | null;
  feedback?: {
    id: string;
    data: { question: string; type: string };
  } | null;
  viewerEmail?: string;
  watermarkConfig?: WatermarkConfig | null;
  ipAddress?: string;
  linkName?: string;
  navData: TNavData;
}) {
  const { isMobile, isPreview, linkId, documentId, viewId, dataroomId, brand } =
    navData;

  const router = useRouter();
  const { status: sessionStatus } = useSession();

  const showStatsSlideWithAccountCreation =
    showAccountCreationSlide && // if showAccountCreationSlide is enabled
    sessionStatus !== "authenticated" && // and user is not authenticated
    !dataroomId; // and it's not a dataroom

  const numPages = pages.length;
  const numPagesWithFeedback =
    enableQuestion && feedback ? numPages + 1 : numPages;

  const numPagesWithAccountCreation = showStatsSlideWithAccountCreation
    ? numPagesWithFeedback + 1
    : numPagesWithFeedback;

  const pageQuery = router.query.p ? Number(router.query.p) : 1;

  const [pageNumber, setPageNumber] = useState<number>(() =>
    pageQuery >= 1 && pageQuery <= numPages ? pageQuery : 1,
  ); // start on first page

  const [loadedImages, setLoadedImages] = useState<boolean[]>(
    new Array(numPages).fill(false),
  );

  const [submittedFeedback, setSubmittedFeedback] = useState<boolean>(false);
  const [accountCreated, setAccountCreated] = useState<boolean>(false);
  const [annotationsEnabled, setAnnotationsEnabled] = useState(false);

  // Fetch annotations for this link
  const { annotations } = useViewerAnnotations(linkId, documentId, viewId);
  const hasAnnotations = annotations && annotations.length > 0;
  const [scale, setScale] = useState<number>(1);

  const initialViewedPages = Array.from({ length: numPages }, (_, index) => ({
    pageNumber: index + 1,
    duration: 0,
  }));

  const [viewedPages, setViewedPages] =
    useState<{ pageNumber: number; duration: number }[]>(initialViewedPages);

  const [isWindowFocused, setIsWindowFocused] = useState(true);

  const startTimeRef = useRef(Date.now());
  const pageNumberRef = useRef<number>(pageNumber);
  const visibilityRef = useRef<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTrackedDownRef = useRef<boolean>(false);
  const hasTrackedUpRef = useRef<boolean>(false);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);

  const [imageDimensions, setImageDimensions] = useState<
    Record<number, { width: number; height: number }>
  >({});
  const {
    trackPageViewSafely,
    resetTrackingState,
    startIntervalTracking,
    stopIntervalTracking,
    getActiveDuration,
    isInactive,
    updateActivity,
  } = useSafePageViewTracker({
    ...getTrackingOptions(),
    externalStartTimeRef: startTimeRef,
  });

  const scaleCoordinates = (coords: string, scaleFactor: number) => {
    return coords
      .split(",")
      .map((coord) => parseFloat(coord) * scaleFactor)
      .join(",");
  };

  const getScaleFactor = ({
    naturalHeight,
    scaleFactor,
  }: {
    naturalHeight: number;
    scaleFactor: number;
  }) => {
    const containerHeight = imageDimensions[pageNumber - 1]
      ? imageDimensions[pageNumber - 1]!.height
      : window.innerHeight - 64;

    // Add a safety check to prevent division by zero
    if (!naturalHeight || naturalHeight === 0) {
      return scaleFactor;
    }

    return (scaleFactor * containerHeight) / naturalHeight;
  };

  useEffect(() => {
    const updateImageDimensions = () => {
      const newDimensions: Record<number, { width: number; height: number }> =
        {};
      imageRefs.current.forEach((img, index) => {
        if (img) {
          newDimensions[index] = {
            width: img.clientWidth,
            height: img.clientHeight,
          };
        }
      });
      setImageDimensions(newDimensions);
    };

    updateImageDimensions();
    window.addEventListener("resize", updateImageDimensions);

    return () => {
      window.removeEventListener("resize", updateImageDimensions);
    };
  }, [loadedImages, pageNumber]);

  // Update the previous page number after the effect hook has run
  useEffect(() => {
    pageNumberRef.current = pageNumber;
    hasTrackedDownRef.current = false; // Reset tracking status on page number change
    hasTrackedUpRef.current = false; // Reset tracking status on page number change
  }, [pageNumber]);

  // Start interval tracking when component mounts or page changes
  useEffect(() => {
    if (pageNumber <= numPages) {
      const trackingData = {
        linkId,
        documentId,
        viewId,
        pageNumber: pageNumber,
        versionNumber,
        dataroomId,
        setViewedPages,
        isPreview,
      };

      startIntervalTracking(trackingData);
    }

    return () => {
      stopIntervalTracking();
    };
  }, [
    pageNumber,
    numPages,
    linkId,
    documentId,
    viewId,
    versionNumber,
    dataroomId,
    isPreview,
    startIntervalTracking,
    stopIntervalTracking,
  ]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (pageNumber > numPages) return;

      if (document.visibilityState === "visible") {
        visibilityRef.current = true;
        resetTrackingState();

        // Restart interval tracking
        if (pageNumber <= numPages) {
          const trackingData = {
            linkId,
            documentId,
            viewId,
            pageNumber: pageNumber,
            versionNumber,
            dataroomId,
            setViewedPages,
            isPreview,
          };
          startIntervalTracking(trackingData);
        }
      } else {
        visibilityRef.current = false;
        stopIntervalTracking();
        if (pageNumber <= numPages) {
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
              setViewedPages,
              isPreview,
            },
            true,
          );
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    pageNumber,
    numPages,
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
      if (pageNumber <= numPages) {
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
            setViewedPages,
            isPreview,
          },
          true,
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    pageNumber,
    numPages,
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
    setLoadedImages((prev) =>
      prev.map((loaded, index) =>
        index < DEFAULT_PRELOADED_IMAGES_NUM ? true : loaded,
      ),
    );
  }, []); // Run once on mount

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

  // Function to preload next image
  const preloadImage = (index: number) => {
    if (index < numPages && !loadedImages[index]) {
      const newLoadedImages = [...loadedImages];
      newLoadedImages[index] = true;
      setLoadedImages(newLoadedImages);
    }
  };

  const goToPreviousPage = () => {
    if (pageNumber <= 1) return;
    if (enableQuestion && feedback && pageNumber === numPagesWithFeedback) {
      setPageNumber(pageNumber - 1);
      startTimeRef.current = Date.now();
      return;
    }

    if (pageNumber === numPagesWithFeedback + 1) {
      setPageNumber(pageNumber - 1);
      startTimeRef.current = Date.now();
      return;
    }

    // Preload previous pages every 4 pages in advanced
    preloadImage(pageNumber - 4);

    const duration = getActiveDuration();
    trackPageViewSafely({
      linkId,
      documentId,
      viewId,
      duration,
      pageNumber: pageNumber,
      versionNumber,
      dataroomId,
      setViewedPages,
      isPreview,
    });

    // decrement page number
    setPageNumber(pageNumber - 1);
    startTimeRef.current = Date.now();
  };

  const goToNextPage = () => {
    if (pageNumber >= numPagesWithAccountCreation) return;

    if (pageNumber > numPages) {
      setPageNumber(pageNumber + 1);
      startTimeRef.current = Date.now();
      return;
    }

    // Preload the next page every 2 pages in advanced
    preloadImage(pageNumber + 2);

    const duration = getActiveDuration();
    trackPageViewSafely({
      linkId,
      documentId,
      viewId,
      duration,
      pageNumber: pageNumber,
      versionNumber,
      dataroomId,
      setViewedPages,
      isPreview,
    });

    // increment page number
    setPageNumber(pageNumber + 1);
    startTimeRef.current = Date.now();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault(); // Prevent default behavior
        event.stopPropagation(); // Stop propagation
        goToNextPage();
        break;
      case "ArrowLeft":
        event.preventDefault(); // Prevent default behavior
        event.stopPropagation(); // Stop propagation
        goToPreviousPage();
        break;
      default:
        break;
    }
  };

  const handleLinkClick = (href: string, event: React.MouseEvent) => {
    // Check if it's an internal page link or external link
    const pageMatch = href.match(/#page=(\d+)/);
    if (pageMatch) {
      event.preventDefault();
      const targetPage = parseInt(pageMatch[1]);
      if (targetPage >= 1 && targetPage <= numPages) {
        // Track the current page before jumping
        const duration = getActiveDuration();
        trackPageViewSafely({
          linkId,
          documentId,
          viewId,
          duration,
          pageNumber: pageNumber,
          versionNumber,
          dataroomId,
          setViewedPages,
          isPreview,
        });

        // Preload target page and 2 pages on either side
        const startPage = Math.max(0, targetPage - 2 - 1);
        const endPage = Math.min(numPages - 1, targetPage + 2 - 1);

        setLoadedImages((prev) => {
          const newLoadedImages = [...prev];
          for (let i = startPage; i <= endPage; i++) {
            newLoadedImages[i] = true;
          }
          return newLoadedImages;
        });

        setPageNumber(targetPage);
        pageNumberRef.current = targetPage;

        // Reset the start time for the new page
        startTimeRef.current = Date.now();
      }
    } else {
      // Track external link clicks
      if (!isPreview && viewId) {
        fetch("/api/record_click", {
          method: "POST",
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            sessionId: viewId,
            linkId,
            documentId,
            viewId,
            pageNumber: pageNumber.toString(),
            href,
            versionNumber,
            dataroomId,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }).catch(console.error); // Non-blocking
      }
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, goToNextPage, goToPreviousPage]);

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
  }, [containerRef.current, pageNumber, imageDimensions]);

  const handleToggleAnnotations = (enabled: boolean) => {
    setAnnotationsEnabled(enabled);
  };

  const navDataWithAnnotations = {
    ...navData,
    annotationsEnabled,
    hasAnnotations,
    onToggleAnnotations: handleToggleAnnotations,
  };

  // Compute scaled sizer dimensions for accurate scroll area
  const currentDims = imageDimensions[pageNumber - 1];
  const scaledWidthPx = currentDims ? currentDims.width * scale : undefined;
  const scaledHeightPx = currentDims ? currentDims.height * scale : undefined;

  return (
    <>
      <Nav
        pageNumber={pageNumber}
        numPages={numPagesWithAccountCreation}
        embeddedLinks={pages[pageNumber - 1]?.embeddedLinks}
        hasWatermark={!!watermarkConfig}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        navData={navDataWithAnnotations}
      />
      <div
        style={{ height: "calc(100dvh - 64px)" }}
        className="relative overflow-hidden"
      >
        <ResizablePanelGroup direction="horizontal">
          {/* Document Content */}
          <ResizablePanel
            defaultSize={annotationsEnabled && hasAnnotations ? 75 : 100}
          >
            <div className="flex h-full w-full items-center">
              <div
                className={cn(
                  "relative h-full w-full",
                  !isWindowFocused &&
                    screenshotProtectionEnabled &&
                    "blur-xl transition-all duration-300",
                )}
                ref={containerRef}
              >
                <div className="h-full w-full overflow-auto">
                  {/* Sizer defines the scrollable layout size at current scale */}
                  <div
                    className="mx-auto"
                    style={{
                      width: scaledWidthPx ? `${scaledWidthPx}px` : "100%",
                      height: scaledHeightPx ? `${scaledHeightPx}px` : "auto",
                    }}
                  >
                    {/* Content is scaled; origin set to top-left so it grows into the sizer */}
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
                      {pageNumber <= numPagesWithAccountCreation &&
                      pages &&
                      loadedImages[pageNumber - 1]
                        ? pages.map((page, index) => (
                            <div
                              key={index}
                              className={cn(
                                "viewer-container relative mx-auto w-full",
                                pageNumber - 1 === index
                                  ? "flex justify-center"
                                  : "hidden",
                              )}
                            >
                              <img
                                className={cn(
                                  "viewer-image-mobile !pointer-events-auto max-h-[calc(100dvh-64px)] object-contain",
                                )}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                ref={(ref) => {
                                  imageRefs.current[index] = ref;
                                  if (ref) {
                                    ref.onload = () =>
                                      setImageDimensions((prev) => ({
                                        ...prev,
                                        [index]: {
                                          width: ref.clientWidth,
                                          height: ref.clientHeight,
                                        },
                                      }));
                                  }
                                }}
                                useMap={`#page-map-${index + 1}`}
                                src={
                                  loadedImages[index]
                                    ? page.file
                                    : "https://www.papermark.com/_static/blank.gif"
                                }
                                alt={`Page ${index + 1}`}
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
                                    imageDimensions[index] || {
                                      width: 0,
                                      height: 0,
                                    }
                                  }
                                  pageIndex={index}
                                />
                              ) : null}

                              {page.pageLinks ? (
                                <map name={`page-map-${index + 1}`}>
                                  {page.pageLinks
                                    .filter(
                                      (link) => !link.href.endsWith(".gif"),
                                    )
                                    .map((link, index) => (
                                      <area
                                        key={index}
                                        shape="rect"
                                        coords={scaleCoordinates(
                                          link.coords,
                                          getScaleFactor({
                                            naturalHeight: page.metadata.height,
                                            scaleFactor:
                                              page.metadata.scaleFactor,
                                          }),
                                        )}
                                        href={link.href}
                                        onClick={(e) =>
                                          handleLinkClick(link.href, e)
                                        }
                                        target={
                                          link.href.startsWith("#")
                                            ? "_self"
                                            : "_blank"
                                        }
                                        rel={
                                          link.href.startsWith("#")
                                            ? undefined
                                            : "noopener noreferrer"
                                        }
                                      />
                                    ))}
                                </map>
                              ) : null}

                              {/** Automatically Render Overlays **/}
                              {page.pageLinks && imageDimensions[index]
                                ? page.pageLinks
                                    .filter((link) =>
                                      link.href.endsWith(".gif"),
                                    )
                                    .map((link, linkIndex) => {
                                      const [x1, y1, x2, y2] = scaleCoordinates(
                                        link.coords,
                                        getScaleFactor({
                                          naturalHeight: page.metadata.height,
                                          scaleFactor:
                                            page.metadata.scaleFactor,
                                        }),
                                      )
                                        .split(",")
                                        .map(Number);

                                      const overlayWidth = x2 - x1;
                                      const overlayHeight = y2 - y1;

                                      // Calculate the offset to center-align with the image
                                      const containerWidth =
                                        imageRefs.current[index]?.parentElement
                                          ?.clientWidth || 0;
                                      const imageWidth =
                                        imageDimensions[index].width;
                                      const leftOffset =
                                        (containerWidth - imageWidth) / 2;

                                      return (
                                        <img
                                          key={`overlay-${index}-${linkIndex}`}
                                          src={link.href}
                                          alt={`Overlay ${index + 1}`}
                                          style={{
                                            position: "absolute",
                                            top: y1,
                                            left: x1 + leftOffset,
                                            width: `${overlayWidth}px`,
                                            height: `${overlayHeight}px`,
                                            pointerEvents: "none",
                                          }}
                                        />
                                      );
                                    })
                                : null}
                            </div>
                          ))
                        : null}

                      {enableQuestion &&
                      feedback &&
                      pageNumber === numPagesWithFeedback ? (
                        <div
                          className={cn("relative block h-dvh w-full")}
                          style={{ height: "calc(100dvh - 64px)" }}
                        >
                          <Question
                            accentColor={brand?.accentColor}
                            feedback={feedback}
                            viewId={viewId}
                            submittedFeedback={submittedFeedback}
                            setSubmittedFeedback={setSubmittedFeedback}
                            isPreview={isPreview}
                          />
                        </div>
                      ) : null}

                      {showStatsSlideWithAccountCreation &&
                      pageNumber === numPagesWithAccountCreation ? (
                        <div
                          className={cn("relative block h-dvh w-full")}
                          style={{ height: "calc(100dvh - 64px)" }}
                        >
                          <ViewDurationSummary
                            linkId={linkId}
                            viewedPages={viewedPages}
                            viewerEmail={viewerEmail}
                            accountCreated={accountCreated}
                            setAccountCreated={setAccountCreated}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation arrows with hover zones */}
              {pageNumber > 1 && (
                <div
                  className={cn(
                    "group absolute left-0 top-0 z-[1] flex h-full items-center",
                    isMobile ? "w-1/6" : "w-32",
                    isMobile ? "justify-start pl-1" : "justify-start pl-4",
                  )}
                  onClick={isMobile ? goToPreviousPage : undefined}
                >
                  <button
                    onClick={!isMobile ? goToPreviousPage : undefined}
                    className={cn(
                      "rounded-full bg-gray-950/50 p-1 transition-opacity duration-200 hover:bg-gray-950/75",
                      "opacity-50 group-hover:opacity-100",
                    )}
                  >
                    <ChevronLeftIcon
                      className={cn("size-10 text-white", isMobile && "size-8")}
                    />
                  </button>
                </div>
              )}

              {pageNumber < numPagesWithAccountCreation && (
                <div
                  className={cn(
                    "group absolute right-0 top-0 z-[1] flex h-full items-center",
                    isMobile ? "w-1/6" : "w-32",
                    isMobile ? "justify-end pr-1" : "justify-end pr-4",
                  )}
                  onClick={isMobile ? goToNextPage : undefined}
                >
                  <button
                    onClick={!isMobile ? goToNextPage : undefined}
                    className={cn(
                      "rounded-full bg-gray-950/50 p-1 transition-opacity duration-200 hover:bg-gray-950/75",
                      "opacity-50 group-hover:opacity-100",
                    )}
                  >
                    <ChevronRightIcon
                      className={cn("size-10 text-white", isMobile && "size-8")}
                    />
                  </button>
                </div>
              )}

              {feedbackEnabled && pageNumber <= numPages ? (
                <Toolbar
                  viewId={viewId}
                  pageNumber={pageNumber}
                  isPreview={isPreview}
                />
              ) : null}

              {screenshotProtectionEnabled ? <ScreenProtector /> : null}
              {showPoweredByBanner ? <PoweredBy linkId={linkId} /> : null}
              <AwayPoster
                isVisible={isInactive}
                inactivityThreshold={getTrackingOptions().inactivityThreshold}
                onDismiss={updateActivity}
              />
            </div>
          </ResizablePanel>

          {/* Annotation Panel - Right Side */}
          {navData.annotationsFeatureEnabled &&
            annotationsEnabled &&
            hasAnnotations && (
              <>
                <ResizableHandle className="w-1 bg-transparent transition-colors hover:bg-white/20" />
                <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
                  <AnnotationPanel
                    brand={brand}
                    linkId={linkId}
                    documentId={documentId}
                    viewId={viewId}
                    currentPage={pageNumber}
                    isVisible={true}
                  />
                </ResizablePanel>
              </>
            )}
        </ResizablePanelGroup>
      </div>
    </>
  );
}
