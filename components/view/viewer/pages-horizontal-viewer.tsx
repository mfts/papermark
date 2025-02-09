import { useRouter } from "next/router";

import { useEffect, useRef, useState } from "react";
import React from "react";

import { Brand, DataroomBrand } from "@prisma/client";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { WatermarkConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/utils/use-media-query";

import { ScreenProtector } from "../ScreenProtection";
import { TDocumentData } from "../dataroom/dataroom-view";
import Nav from "../nav";
import { PoweredBy } from "../powered-by";
import Question from "../question";
import { ScreenShield } from "../screen-shield";
import Toolbar from "../toolbar";
import ViewDurationSummary from "../visitor-graph";
import { SVGWatermark } from "../watermark-svg";

const DEFAULT_PRELOADED_IMAGES_NUM = 5;

const trackPageView = async (data: {
  linkId: string;
  documentId: string;
  viewId?: string;
  duration: number;
  pageNumber: number;
  versionNumber: number;
  dataroomId?: string;
  setViewedPages?: React.Dispatch<
    React.SetStateAction<{ pageNumber: number; duration: number }[]>
  >;
  isPreview?: boolean;
}) => {
  data.setViewedPages &&
    data.setViewedPages((prevViewedPages) =>
      prevViewedPages.map((page) =>
        page.pageNumber === data.pageNumber
          ? { ...page, duration: page.duration + data.duration }
          : page,
      ),
    );

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

export default function PagesHorizontalViewer({
  pages,
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
  pages: {
    file: string;
    pageNumber: string;
    embeddedLinks: string[];
    pageLinks: { href: string; coords: string }[];
    metadata: { width: number; height: number; scaleFactor: number };
  }[];
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
  const scrollActionRef = useRef<boolean>(false);
  const hasTrackedDownRef = useRef<boolean>(false);
  const hasTrackedUpRef = useRef<boolean>(false);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);

  const [imageDimensions, setImageDimensions] = useState<
    Record<number, { width: number; height: number }>
  >({});

  const { isMobile } = useMediaQuery();

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
            setViewedPages,
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
        setViewedPages,
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
          setViewedPages,
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

    const duration = Date.now() - startTimeRef.current;
    trackPageView({
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

    const duration = Date.now() - startTimeRef.current;
    trackPageView({
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
        const duration = Date.now() - startTimeRef.current;
        trackPageView({
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

  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  return (
    <>
      <Nav
        pageNumber={pageNumber}
        numPages={numPagesWithAccountCreation}
        assistantEnabled={assistantEnabled}
        allowDownload={allowDownload}
        brand={brand}
        viewId={viewId}
        linkId={linkId}
        documentId={documentId}
        documentName={documentName}
        embeddedLinks={pages[pageNumber - 1]?.embeddedLinks}
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
        className={cn("relative flex items-center overflow-hidden")}
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
              {pageNumber <= numPagesWithAccountCreation &&
              pages &&
              loadedImages[pageNumber - 1]
                ? pages.map((page, index) => (
                    <div
                      key={index}
                      className={cn(
                        "relative mx-auto w-full",
                        pageNumber - 1 === index
                          ? "flex justify-center"
                          : "hidden",
                      )}
                    >
                      <img
                        className={cn(
                          "!pointer-events-auto max-h-[calc(100dvh-64px)] object-contain",
                        )}
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
                            : "https://www.papermark.io/_static/blank.gif"
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
                            .filter((link) => !link.href.includes(".gif"))
                            .map((link, index) => (
                              <area
                                key={index}
                                shape="rect"
                                coords={scaleCoordinates(
                                  link.coords,
                                  getScaleFactor({
                                    naturalHeight: page.metadata.height,
                                    scaleFactor: page.metadata.scaleFactor,
                                  }),
                                )}
                                href={link.href}
                                onClick={(e) => handleLinkClick(link.href, e)}
                                target={
                                  link.href.startsWith("#") ? "_self" : "_blank"
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
                      {page.pageLinks
                        ? page.pageLinks
                            .filter((link) => link.href.includes(".gif"))
                            .map((link, linkIndex) => {
                              const [x1, y1, x2, y2] = scaleCoordinates(
                                link.coords,
                                getScaleFactor({
                                  naturalHeight: page.metadata.height,
                                  scaleFactor: page.metadata.scaleFactor,
                                }),
                              )
                                .split(",")
                                .map(Number);

                              const overlayWidth = x2 - x1;
                              const overlayHeight = y2 - y1;

                              return (
                                <img
                                  key={`overlay-${index}-${linkIndex}`}
                                  src={link.href} // Assuming the href points to a GIF or overlay image
                                  alt={`Overlay ${index + 1}`}
                                  style={{
                                    position: "absolute",
                                    top: y1,
                                    left: x1,
                                    width: `${overlayWidth}px`,
                                    height: `${overlayHeight}px`,
                                    pointerEvents: "none", // To ensure the overlay doesn't interfere with interaction
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
        {!!screenShieldPercentage ? (
          <ScreenShield visiblePercentage={screenShieldPercentage} />
        ) : null}
        {screenshotProtectionEnabled ? <ScreenProtector /> : null}
        {showPoweredByBanner ? <PoweredBy linkId={linkId} /> : null}
      </div>
    </>
  );
}
