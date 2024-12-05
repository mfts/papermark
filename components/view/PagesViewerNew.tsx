import { useRouter } from "next/router";

import { useEffect, useRef, useState } from "react";
import React from "react";

import { Brand, DataroomBrand } from "@prisma/client";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "lucide-react";
import { useSession } from "next-auth/react";
import {
  ReactZoomPanPinchContentRef,
  TransformComponent,
  TransformWrapper,
} from "react-zoom-pan-pinch";
import { toast } from "sonner";

import { WatermarkConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/utils/use-media-query";

import { ScreenProtector } from "./ScreenProtection";
import { TDocumentData } from "./dataroom/dataroom-view";
import Nav from "./nav";
import { PoweredBy } from "./powered-by";
import Question from "./question";
import { ScreenShield } from "./screen-shield";
import Toolbar from "./toolbar";
import ViewDurationSummary from "./visitor-graph";
import { SVGWatermark } from "./watermark-svg";

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

export default function PagesViewer({
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
  isVertical = false,
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
  isVertical?: boolean;
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
    !dataroomId && // and it's not a dataroom
    !isVertical; // and it's not vertical document

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
  const pinchRefs = useRef<(ReactZoomPanPinchContentRef | null)[]>([]);
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

  const handleScroll = () => {
    if (!isVertical) return;

    const container = containerRef.current;
    if (!container) return;

    const scrollPosition = container.scrollTop;
    const pageHeight = container.scrollHeight / numPagesWithAccountCreation;

    const currentPage = Math.floor(scrollPosition / pageHeight) + 1;
    const currentPageFraction = (scrollPosition % pageHeight) / pageHeight;

    if (scrollActionRef.current) {
      if (scrollPosition % pageHeight === 0) {
        scrollActionRef.current = false;
      }
      return;
    }

    // Do not track the question page
    if (currentPage > numPages) {
      setPageNumber(currentPage);
      startTimeRef.current = Date.now();
      return;
    }

    // Always preload surrounding pages during scroll
    const startPage = Math.max(0, currentPage - 2 - 1);
    const endPage = Math.min(numPages - 1, currentPage + 2 - 1);

    setLoadedImages((prev) => {
      const newLoadedImages = [...prev];
      for (let i = startPage; i <= endPage; i++) {
        newLoadedImages[i] = true;
      }
      return newLoadedImages;
    });

    // Scroll Down Tracking
    if (
      currentPageFraction > 0.5 &&
      currentPage === pageNumber &&
      !hasTrackedDownRef.current
    ) {
      // Track the page view
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
      setPageNumber(currentPage);
      pageNumberRef.current = currentPage;
      startTimeRef.current = Date.now();
      hasTrackedDownRef.current = true;
      hasTrackedUpRef.current = false;
    } else if (
      currentPageFraction > 0.5 &&
      currentPage === pageNumber - 1 &&
      !hasTrackedDownRef.current
    ) {
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
      setPageNumber(currentPage);
      pageNumberRef.current = currentPage;
      startTimeRef.current = Date.now();
      hasTrackedDownRef.current = true;
      hasTrackedUpRef.current = false;
    }

    // Scroll Up Tracking
    if (
      currentPageFraction <= 0.5 &&
      currentPage === pageNumber &&
      !hasTrackedUpRef.current
    ) {
      // Track the page view
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
      setPageNumber(currentPage);
      pageNumberRef.current = currentPage;
      startTimeRef.current = Date.now();
      hasTrackedUpRef.current = true;
      hasTrackedDownRef.current = false;
    } else if (
      currentPageFraction <= 0.5 &&
      currentPage === pageNumber + 1 &&
      !hasTrackedUpRef.current
    ) {
      const duration = Date.now() - startTimeRef.current;
      trackPageView({
        linkId,
        documentId,
        viewId,
        duration,
        pageNumber: pageNumber + 1,
        versionNumber,
        dataroomId,
        setViewedPages,
        isPreview,
      });
      setPageNumber(currentPage);
      pageNumberRef.current = currentPage;
      startTimeRef.current = Date.now();
      hasTrackedUpRef.current = true;
      hasTrackedDownRef.current = false;
    }
  };

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
      if (isVertical) {
        scrollActionRef.current = true;
        const newScrollPosition =
          ((pageNumber - 2) * containerRef.current!.scrollHeight) /
          numPagesWithAccountCreation;
        containerRef.current?.scrollTo({
          top: newScrollPosition,
          behavior: "smooth",
        });
      }
      setPageNumber(pageNumber - 1);
      startTimeRef.current = Date.now();
      return;
    }

    if (pageNumber === numPagesWithFeedback + 1) {
      if (isVertical) {
        scrollActionRef.current = true;
        const newScrollPosition =
          (pageNumber - 2) * containerRef.current!.clientHeight;
        containerRef.current?.scrollTo({
          top: newScrollPosition,
          behavior: "smooth",
        });
      }
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

    if (isVertical) {
      scrollActionRef.current = true;
      const newScrollPosition =
        ((pageNumber - 2) * containerRef.current!.scrollHeight) /
        numPagesWithAccountCreation;
      containerRef.current?.scrollTo({
        top: newScrollPosition,
        behavior: "smooth",
      });
    }

    // decrement page number
    setPageNumber(pageNumber - 1);
    startTimeRef.current = Date.now();
  };

  const goToNextPage = () => {
    if (pageNumber >= numPagesWithAccountCreation) return;

    if (pageNumber > numPages) {
      if (isVertical) {
        scrollActionRef.current = true;
        const newScrollPosition =
          pageNumber * containerRef.current!.clientHeight;
        containerRef.current?.scrollTo({
          top: newScrollPosition,
          behavior: "smooth",
        });
      }
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

    if (isVertical) {
      scrollActionRef.current = true;
      const newScrollPosition =
        (pageNumber * containerRef.current!.scrollHeight) /
        numPagesWithAccountCreation;
      console.log("newScrollPosition", newScrollPosition);
      containerRef.current?.scrollTo({
        top: newScrollPosition,
        behavior: "smooth",
      });
    }

    // increment page number
    setPageNumber(pageNumber + 1);
    startTimeRef.current = Date.now();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (isVertical) {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault(); // Prevent default behavior
          event.stopPropagation(); // Stop propagation
          goToNextPage();
          break;
        case "ArrowUp":
          event.preventDefault(); // Prevent default behavior
          event.stopPropagation(); // Stop propagation
          goToPreviousPage();
          break;
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
    } else {
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
        if (isVertical && containerRef.current) {
          scrollActionRef.current = true;
          const newScrollPosition =
            ((targetPage - 1) * containerRef.current.scrollHeight) /
            numPagesWithAccountCreation;
          containerRef.current.scrollTo({
            top: newScrollPosition,
            behavior: "smooth",
          });
        }

        // Reset the start time for the new page
        startTimeRef.current = Date.now();
      }
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, goToNextPage, goToPreviousPage]);

  useEffect(() => {
    if (!isVertical) return;

    if (isVertical && containerRef.current) {
      containerRef.current.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (isVertical && containerRef.current) {
        containerRef.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isVertical, handleScroll]);

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
        isDataroom={dataroomId ? true : false}
        setDocumentData={setDocumentData}
        documentRefs={pinchRefs}
        isVertical={isVertical}
        isMobile={isMobile}
        isPreview={isPreview}
        hasWatermark={watermarkConfig ? true : false}
      />
      <div
        style={{ height: "calc(100dvh - 64px)" }}
        className={cn("relative flex items-center", isVertical && "h-dvh")}
      >
        <div
          className={cn(
            "relative flex h-full w-full",
            isVertical ? "flex-col overflow-y-auto" : "flex-row",
            !isWindowFocused &&
              screenshotProtectionEnabled &&
              "blur-xl transition-all duration-300",
          )}
          ref={containerRef}
        >
          <div
            className={cn(
              "flex w-full",
              isVertical ? "flex-col items-center" : "flex-row justify-center",
            )}
            onContextMenu={handleContextMenu}
          >
            {pageNumber <= numPagesWithAccountCreation &&
            pages &&
            loadedImages[pageNumber - 1]
              ? pages.map((page, index) => (
                  <React.Fragment key={index}>
                    <TransformWrapper
                      key={index}
                      initialScale={scale}
                      initialPositionX={0}
                      initialPositionY={0}
                      disabled={isVertical && isMobile}
                      panning={{
                        lockAxisY: isVertical,
                        velocityDisabled: true,
                        wheelPanning: false,
                      }}
                      wheel={{ disabled: true }}
                      pinch={{ disabled: true }}
                      doubleClick={{ disabled: true }}
                      onZoom={(ref) => {
                        setScale(ref.state.scale);
                      }}
                      ref={(ref) => {
                        pinchRefs.current[index] = ref;
                      }}
                      customTransform={(
                        x: number,
                        y: number,
                        scale: number,
                      ) => {
                        // Keep the translateY value constant
                        if (isVertical) {
                          const transform = `translate(${x}px, ${index * y * -2}px) scale(${scale})`;
                          return transform;
                        }
                        const transform = `translate(${x}px, ${y}px) scale(${scale})`;
                        return transform;
                      }}
                    >
                      <TransformComponent
                        wrapperClass={cn(
                          !isVertical && "!h-full",
                          isVertical
                            ? "!overflow-x-clip !overflow-y-visible"
                            : isMobile
                              ? "!overflow-x-clip !overflow-y-clip"
                              : "!overflow-x-visible !overflow-y-clip",
                        )}
                        contentClass={cn(
                          !isVertical && "!h-full",
                          isVertical && "!w-dvw !h-[calc(100dvh-64px)]",
                        )}
                      >
                        <div
                          key={index}
                          className={cn(
                            "relative my-auto w-full",
                            pageNumber - 1 === index && !isVertical
                              ? "block"
                              : "hidden",
                            isVertical && "flex justify-center",
                          )}
                        >
                          <img
                            className={cn(
                              "!pointer-events-auto object-contain",
                              isVertical && "h-auto",
                            )}
                            style={{
                              maxHeight: "calc(100dvh - 64px)",
                            }}
                            // ref={(ref) => {
                            //   imageRefs.current[index] = ref;
                            // }}
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
                      </TransformComponent>
                    </TransformWrapper>
                  </React.Fragment>
                ))
              : null}

            {enableQuestion &&
            feedback &&
            (isVertical || pageNumber === numPagesWithFeedback) ? (
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
            !isVertical &&
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

        {isVertical && (
          <>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform">
              <button
                onClick={goToNextPage}
                disabled={pageNumber >= numPagesWithAccountCreation}
                className={cn(
                  "rounded-full bg-gray-950/50 p-1 hover:bg-gray-950/75",
                  pageNumber >= numPagesWithAccountCreation && "hidden",
                )}
              >
                <ChevronDownIcon className="h-10 w-10 text-white" />
              </button>
            </div>
            <div className="absolute left-1/2 top-4 -translate-x-1/2 transform">
              <button
                onClick={goToPreviousPage}
                disabled={pageNumber === 1}
                className={cn(
                  "rounded-full bg-gray-950/50 p-1 hover:bg-gray-950/75",
                  pageNumber == 1 && "hidden",
                )}
              >
                <ChevronUpIcon className="h-10 w-10 text-white" />
              </button>
            </div>
          </>
        )}
        {!isVertical && (
          <>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 transform">
              <button
                onClick={goToPreviousPage}
                disabled={pageNumber === 1}
                className={cn(
                  "rounded-full bg-gray-950/50 p-1 hover:bg-gray-950/75",
                  pageNumber == 1 && "hidden",
                )}
              >
                <ChevronLeftIcon className="h-10 w-10 text-white" />
              </button>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 transform">
              <button
                onClick={goToNextPage}
                disabled={pageNumber >= numPagesWithAccountCreation}
                className={cn(
                  "rounded-full bg-gray-950/50 p-1 hover:bg-gray-950/75",
                  pageNumber >= numPagesWithAccountCreation && "hidden",
                )}
              >
                <ChevronRightIcon className="h-10 w-10 text-white" />
              </button>
            </div>
          </>
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
