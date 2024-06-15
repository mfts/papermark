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
import {
  ReactZoomPanPinchContentRef,
  TransformComponent,
  TransformWrapper,
} from "react-zoom-pan-pinch";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { ScreenProtector } from "./ScreenProtection";
import { TDocumentData } from "./dataroom/dataroom-view";
import Nav from "./nav";
import { PoweredBy } from "./powered-by";
import Question from "./question";
import Toolbar from "./toolbar";

const DEFAULT_PRELOADED_IMAGES_NUM = 5;

const trackPageView = async (data: {
  linkId: string;
  documentId: string;
  viewId: string;
  duration: number;
  pageNumber: number;
  versionNumber: number;
  dataroomId?: string;
}) => {
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
  versionNumber,
  brand,
  documentName,
  dataroomId,
  setDocumentData,
  showPoweredByBanner,
  enableQuestion = false,
  feedback,
  isVertical = false,
}: {
  pages: { file: string; pageNumber: string; embeddedLinks: string[] }[];
  linkId: string;
  documentId: string;
  viewId: string;
  assistantEnabled?: boolean;
  allowDownload: boolean;
  feedbackEnabled: boolean;
  screenshotProtectionEnabled: boolean;
  versionNumber: number;
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
  documentName?: string;
  dataroomId?: string;
  setDocumentData?: React.Dispatch<React.SetStateAction<TDocumentData | null>>;
  showPoweredByBanner?: boolean;
  enableQuestion?: boolean | null;
  feedback?: {
    id: string;
    data: { question: string; type: string };
  } | null;
  isVertical?: boolean;
}) {
  const router = useRouter();

  const numPages = pages.length;
  const numPagesWithFeedback =
    enableQuestion && feedback ? numPages + 1 : numPages;

  const pageQuery = router.query.p ? Number(router.query.p) : 1;

  const [pageNumber, setPageNumber] = useState<number>(() =>
    pageQuery >= 1 && pageQuery <= numPages ? pageQuery : 1,
  ); // start on first page

  const [loadedImages, setLoadedImages] = useState<boolean[]>(
    new Array(numPages).fill(false),
  );

  const [submittedFeedback, setSubmittedFeedback] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1);

  const startTimeRef = useRef(Date.now());
  const pageNumberRef = useRef<number>(pageNumber);
  const visibilityRef = useRef<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollActionRef = useRef<boolean>(false);
  const hasTrackedDownRef = useRef<boolean>(false);
  const hasTrackedUpRef = useRef<boolean>(false);
  const pinchRefs = useRef<(ReactZoomPanPinchContentRef | null)[]>([]);

  // Update the previous page number after the effect hook has run
  useEffect(() => {
    pageNumberRef.current = pageNumber;
    hasTrackedDownRef.current = false; // Reset tracking status on page number change
    hasTrackedUpRef.current = false; // Reset tracking status on page number change
  }, [pageNumber]);

  useEffect(() => {
    const handleVisibilityChange = () => {
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
            pageNumber: pageNumberRef.current,
            versionNumber,
            dataroomId,
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

    return () => {
      if (
        visibilityRef.current &&
        pageNumber <= numPages &&
        pageNumberRef.current <= numPages
      ) {
        const duration = Date.now() - startTimeRef.current;
        trackPageView({
          linkId,
          documentId,
          viewId,
          duration,
          pageNumber: pageNumberRef.current,
          versionNumber,
          dataroomId,
        });
      }
    };
  }, [pageNumber, pageNumberRef.current, numPages]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pageNumber <= numPages && visibilityRef.current) {
        const duration = Date.now() - startTimeRef.current;
        trackPageView({
          linkId,
          documentId,
          viewId,
          duration,
          pageNumber: pageNumberRef.current,
          versionNumber,
          dataroomId,
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pageNumber, numPages]);

  useEffect(() => {
    setLoadedImages((prev) =>
      prev.map((loaded, index) =>
        index < DEFAULT_PRELOADED_IMAGES_NUM ? true : loaded,
      ),
    );
  }, []); // Run once on mount

  useEffect(() => {
    // Remove token and email query parameters on component mount
    const removeQueryParams = () => {
      const currentQuery = { ...router.query };
      delete currentQuery.token;
      delete currentQuery.email;

      router.replace(
        {
          pathname: router.pathname,
          query: currentQuery,
        },
        undefined,
        { shallow: true },
      );
    };

    if (!dataroomId && router.query.token) {
      removeQueryParams();
    }
  }, []); // Run once on mount

  const handleScroll = () => {
    if (!isVertical) return;

    const container = containerRef.current;
    if (!container) return;

    const scrollPosition = container.scrollTop;
    const pageHeight = container.clientHeight;

    const currentPage = Math.floor(scrollPosition / pageHeight) + 1;
    const currentPageFraction = (scrollPosition % pageHeight) / pageHeight;

    if (scrollActionRef.current) {
      if (scrollPosition % pageHeight === 0) {
        scrollActionRef.current = false;
      }
      return;
    }

    // Do not track the question page
    if (currentPage === numPages + 1) {
      setPageNumber(currentPage);
      startTimeRef.current = Date.now();
      return;
    }

    // Scroll Down Tracking
    if (
      currentPageFraction >= 0.8 &&
      currentPage === pageNumberRef.current &&
      !hasTrackedDownRef.current
    ) {
      const duration = Date.now() - startTimeRef.current;
      trackPageView({
        linkId,
        documentId,
        viewId,
        duration,
        pageNumber: pageNumberRef.current,
        versionNumber,
        dataroomId,
      });
      setPageNumber(currentPage);
      pageNumberRef.current = currentPage;
      startTimeRef.current = Date.now();
      hasTrackedDownRef.current = true;
      hasTrackedUpRef.current = false;
    } else if (
      currentPageFraction >= 0.8 &&
      currentPage === pageNumberRef.current - 1 &&
      !hasTrackedDownRef.current
    ) {
      const duration = Date.now() - startTimeRef.current;
      if (currentPage !== numPagesWithFeedback - 1) {
        trackPageView({
          linkId,
          documentId,
          viewId,
          duration,
          pageNumber: pageNumberRef.current,
          versionNumber,
          dataroomId,
        });
      }
      setPageNumber(currentPage);
      pageNumberRef.current = currentPage;
      startTimeRef.current = Date.now();
      hasTrackedDownRef.current = true;
      hasTrackedUpRef.current = false;
    }

    // Scroll Up Tracking
    if (
      currentPageFraction <= 0.2 &&
      currentPage === pageNumberRef.current &&
      !hasTrackedUpRef.current
    ) {
      const duration = Date.now() - startTimeRef.current;
      if (currentPage !== numPagesWithFeedback - 1) {
        trackPageView({
          linkId,
          documentId,
          viewId,
          duration,
          pageNumber: pageNumberRef.current,
          versionNumber,
          dataroomId,
        });
      }
      setPageNumber(currentPage);
      pageNumberRef.current = currentPage;
      startTimeRef.current = Date.now();
      hasTrackedUpRef.current = true;
      hasTrackedDownRef.current = false;
    } else if (
      currentPageFraction <= 0.2 &&
      currentPage === pageNumberRef.current + 1 &&
      !hasTrackedUpRef.current
    ) {
      const duration = Date.now() - startTimeRef.current;
      trackPageView({
        linkId,
        documentId,
        viewId,
        duration,
        pageNumber: pageNumberRef.current + 1,
        versionNumber,
        dataroomId,
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
    if (!screenshotProtectionEnabled) {
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

    const duration = Date.now() - startTimeRef.current;
    trackPageView({
      linkId,
      documentId,
      viewId,
      duration,
      pageNumber: pageNumberRef.current,
      versionNumber,
      dataroomId,
    });

    setPageNumber(pageNumber - 1);
    pageNumberRef.current = pageNumber - 1;
    startTimeRef.current = Date.now();

    if (isVertical) {
      scrollActionRef.current = true;
      const newScrollPosition =
        (pageNumberRef.current - 1) * containerRef.current!.clientHeight;
      containerRef.current?.scrollTo({
        top: newScrollPosition,
        behavior: "smooth",
      });
    }
  };

  const goToNextPage = () => {
    if (pageNumberRef.current >= numPagesWithFeedback) {
      return;
    }

    preloadImage(DEFAULT_PRELOADED_IMAGES_NUM - 1 + pageNumber);

    const duration = Date.now() - startTimeRef.current;
    trackPageView({
      linkId,
      documentId,
      viewId,
      duration,
      pageNumber: pageNumberRef.current,
      versionNumber,
      dataroomId,
    });

    setPageNumber(pageNumber + 1);
    pageNumberRef.current = pageNumber + 1;
    startTimeRef.current = Date.now();

    if (isVertical) {
      scrollActionRef.current = true;
      const newScrollPosition =
        (pageNumberRef.current - 1) * containerRef.current!.clientHeight;
      containerRef.current?.scrollTo({
        top: newScrollPosition,
        behavior: "smooth",
      });
    }
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
        numPages={numPagesWithFeedback}
        assistantEnabled={assistantEnabled}
        allowDownload={allowDownload}
        brand={brand}
        viewId={viewId}
        linkId={linkId}
        documentName={documentName}
        embeddedLinks={pages[pageNumber - 1]?.embeddedLinks}
        isDataroom={dataroomId ? true : false}
        setDocumentData={setDocumentData}
        documentRefs={pinchRefs}
      />
      <div
        style={{ height: "calc(100vh - 64px)" }}
        className={cn("relative flex items-center", isVertical && "h-screen")}
      >
        <div
          className={`relative flex h-full w-full ${
            isVertical ? "flex-col overflow-y-auto" : "flex-row"
          }`}
          ref={containerRef}
        >
          <div
            className={`flex ${isVertical ? "flex-col items-center" : "flex-row justify-center"} w-full`}
            onContextMenu={handleContextMenu}
          >
            {pageNumber <= numPagesWithFeedback &&
              pages.map((page, index) => (
                <TransformWrapper
                  key={index}
                  initialScale={scale}
                  panning={{ disabled: scale === 1, velocityDisabled: true }}
                  wheel={{ disabled: scale === 1 }}
                  onZoom={(ref) => {
                    setScale(ref.state.scale);
                  }}
                  ref={(ref) => {
                    pinchRefs.current[index] = ref;
                  }}
                >
                  <TransformComponent>
                    <div
                      key={index}
                      style={{ height: "calc(100vh - 64px)" }}
                      className={cn(
                        "relative h-screen w-full",
                        pageNumber - 1 === index
                          ? "block"
                          : !isVertical
                            ? "hidden"
                            : "block",
                      )}
                    >
                      <img
                        className={cn("h-full w-full object-contain")}
                        src={page.file}
                        alt={`Page ${index + 1}`}
                      />
                    </div>
                  </TransformComponent>
                </TransformWrapper>
              ))}

            {enableQuestion &&
            feedback &&
            (isVertical || pageNumber === numPagesWithFeedback) ? (
              <div
                className={cn("relative block h-screen w-full")}
                style={{ height: "calc(100vh - 64px)" }}
              >
                <Question
                  feedback={feedback}
                  viewId={viewId}
                  submittedFeedback={submittedFeedback}
                  setSubmittedFeedback={setSubmittedFeedback}
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
                disabled={pageNumber >= numPagesWithFeedback}
                className={cn(
                  "rounded-full bg-gray-950/50 p-1 hover:bg-gray-950/75",
                  pageNumber >= numPagesWithFeedback && "hidden",
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
                disabled={pageNumber >= numPagesWithFeedback}
                className={cn(
                  "rounded-full bg-gray-950/50 p-1 hover:bg-gray-950/75",
                  pageNumber >= numPagesWithFeedback && "hidden",
                )}
              >
                <ChevronRightIcon className="h-10 w-10 text-white" />
              </button>
            </div>
          </>
        )}
        {feedbackEnabled && pageNumber !== numPages + 1 ? (
          <Toolbar viewId={viewId} pageNumber={pageNumber} />
        ) : null}
        {screenshotProtectionEnabled ? <ScreenProtector /> : null}
        {showPoweredByBanner ? <PoweredBy linkId={linkId} /> : null}
      </div>
    </>
  );
}
