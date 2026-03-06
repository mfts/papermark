import { useRouter } from "next/router";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import React from "react";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { useSafePageViewTracker } from "@/lib/tracking/safe-page-view-tracker";
import { getTrackingOptions } from "@/lib/tracking/tracking-config";
import { WatermarkConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { paginateText, TEXT_PAGE_DEFAULTS } from "@/lib/utils/text-pagination";

import { ScreenProtector } from "../ScreenProtection";
import Nav, { TNavData } from "../nav";
import { PoweredBy } from "../powered-by";
import { SVGWatermark } from "../watermark-svg";
import { AwayPoster } from "./away-poster";

import "@/styles/custom-viewer-styles.css";

const CANVAS_WIDTH = 816;
const CANVAS_HEIGHT = 1056;
const CANVAS_PADDING = 48;
const FONT_SIZE = 14;
const LINE_HEIGHT = Math.floor(
  (CANVAS_HEIGHT - CANVAS_PADDING * 2) / TEXT_PAGE_DEFAULTS.linesPerPage,
);
const FONT_FAMILY = '"Courier New", Courier, monospace';

function renderPageToCanvas(
  canvas: HTMLCanvasElement,
  lines: string[],
  dpr: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  canvas.style.width = `${CANVAS_WIDTH}px`;
  canvas.style.height = `${CANVAS_HEIGHT}px`;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  ctx.fillStyle = "#1a1a1a";
  ctx.textBaseline = "top";

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(
      lines[i],
      CANVAS_PADDING,
      CANVAS_PADDING + i * LINE_HEIGHT,
    );
  }
}

export default function TextViewer({
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

  const [pages, setPages] = useState<string[][] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageQuery = router.query.p ? Number(router.query.p) : 1;
  const [pageNumber, setPageNumber] = useState<number>(1);

  const [scale, setScale] = useState<number>(1);
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  const startTimeRef = useRef(Date.now());
  const pageNumberRef = useRef<number>(pageNumber);
  const visibilityRef = useRef<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const numPages = pages?.length ?? 0;

  const initialViewedPages = useMemo(
    () =>
      Array.from({ length: numPages }, (_, index) => ({
        pageNumber: index + 1,
        duration: 0,
      })),
    [numPages],
  );

  const [viewedPages, setViewedPages] =
    useState<{ pageNumber: number; duration: number }[]>(initialViewedPages);

  useEffect(() => {
    setViewedPages(initialViewedPages);
  }, [initialViewedPages]);

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

  // Fetch text content and paginate
  useEffect(() => {
    let cancelled = false;
    async function fetchText() {
      try {
        setLoading(true);
        const response = await fetch(file);
        if (!response.ok) throw new Error("Failed to load text file");
        const text = await response.text();
        if (cancelled) return;
        const paginatedPages = paginateText(text);
        setPages(paginatedPages);

        const initialPage =
          pageQuery >= 1 && pageQuery <= paginatedPages.length ? pageQuery : 1;
        setPageNumber(initialPage);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load file");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchText();
    return () => {
      cancelled = true;
    };
  }, [file]);

  // Render current page to canvas
  useEffect(() => {
    if (!pages || !canvasRef.current) return;
    const currentPageLines = pages[pageNumber - 1];
    if (!currentPageLines) return;
    const dpr = window.devicePixelRatio || 1;
    renderPageToCanvas(canvasRef.current, currentPageLines, dpr);
  }, [pages, pageNumber]);

  // Update page number ref
  useEffect(() => {
    pageNumberRef.current = pageNumber;
  }, [pageNumber]);

  // Start interval tracking when component mounts or page changes
  useEffect(() => {
    if (numPages === 0) return;

    const trackingData = {
      linkId,
      documentId,
      viewId,
      pageNumber,
      versionNumber,
      dataroomId,
      setViewedPages,
      isPreview,
    };
    startIntervalTracking(trackingData);

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
      if (numPages === 0) return;

      if (document.visibilityState === "visible") {
        visibilityRef.current = true;
        resetTrackingState();
        const trackingData = {
          linkId,
          documentId,
          viewId,
          pageNumber,
          versionNumber,
          dataroomId,
          setViewedPages,
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
            pageNumber,
            versionNumber,
            dataroomId,
            setViewedPages,
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
      if (numPages === 0) return;
      stopIntervalTracking();
      const duration = getActiveDuration();
      trackPageViewSafely(
        {
          linkId,
          documentId,
          viewId,
          duration,
          pageNumber,
          versionNumber,
          dataroomId,
          setViewedPages,
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

  // Screenshot protection: blur on window blur
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

  // Remove query params on mount
  useEffect(() => {
    const removeQueryParams = (queries: string[]) => {
      const currentQuery = { ...router.query };
      const currentPath = router.asPath.split("?")[0];
      queries.map((query) => delete currentQuery[query]);
      router.replace(
        { pathname: currentPath, query: currentQuery },
        undefined,
        { shallow: true },
      );
    };

    if (!dataroomId && router.query.token) {
      removeQueryParams(["token", "email", "domain", "slug", "linkId"]);
    }
  }, []);

  const goToPreviousPage = useCallback(() => {
    if (pageNumber <= 1) return;
    const duration = getActiveDuration();
    trackPageViewSafely({
      linkId,
      documentId,
      viewId,
      duration,
      pageNumber,
      versionNumber,
      dataroomId,
      setViewedPages,
      isPreview,
    });
    setPageNumber(pageNumber - 1);
    startTimeRef.current = Date.now();
  }, [
    pageNumber,
    linkId,
    documentId,
    viewId,
    versionNumber,
    dataroomId,
    isPreview,
    getActiveDuration,
    trackPageViewSafely,
  ]);

  const goToNextPage = useCallback(() => {
    if (pageNumber >= numPages) return;
    const duration = getActiveDuration();
    trackPageViewSafely({
      linkId,
      documentId,
      viewId,
      duration,
      pageNumber,
      versionNumber,
      dataroomId,
      setViewedPages,
      isPreview,
    });
    setPageNumber(pageNumber + 1);
    startTimeRef.current = Date.now();
  }, [
    pageNumber,
    numPages,
    linkId,
    documentId,
    viewId,
    versionNumber,
    dataroomId,
    isPreview,
    getActiveDuration,
    trackPageViewSafely,
  ]);

  // Keyboard navigation: arrow keys for pages
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        goToNextPage();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        goToPreviousPage();
      } else if (e.metaKey || e.ctrlKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          setScale((prev) => Math.min(prev + 0.25, 3));
        } else if (e.key === "-") {
          e.preventDefault();
          setScale((prev) => Math.max(prev - 0.25, 0.5));
        } else if (e.key === "0") {
          e.preventDefault();
          setScale(1);
        }
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        handleFullscreen();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [goToNextPage, goToPreviousPage]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  if (loading) {
    return (
      <>
        <Nav
          pageNumber={1}
          numPages={1}
          hasWatermark={!!watermarkConfig}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          handleFullscreen={handleFullscreen}
          navData={navData}
        />
        <div
          style={{ height: "calc(100dvh - 64px)" }}
          className="flex items-center justify-center"
        >
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </>
    );
  }

  if (error || !pages) {
    return (
      <>
        <Nav
          pageNumber={1}
          numPages={1}
          hasWatermark={!!watermarkConfig}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          handleFullscreen={handleFullscreen}
          navData={navData}
        />
        <div
          style={{ height: "calc(100dvh - 64px)" }}
          className="flex items-center justify-center"
        >
          <div className="text-destructive">
            {error ?? "Failed to load file"}
          </div>
        </div>
      </>
    );
  }

  const canvasScaledWidth = CANVAS_WIDTH * scale;
  const canvasScaledHeight = CANVAS_HEIGHT * scale;

  return (
    <>
      <Nav
        pageNumber={pageNumber}
        numPages={numPages}
        hasWatermark={!!watermarkConfig}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        handleFullscreen={handleFullscreen}
        navData={navData}
      />
      <div
        style={{ height: "calc(100dvh - 64px)" }}
        className="relative overflow-hidden"
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
              <div
                className="mx-auto"
                style={{
                  width:
                    scale > 1 ? `${canvasScaledWidth}px` : "100%",
                  height:
                    scale > 1 ? `${canvasScaledHeight}px` : "auto",
                }}
              >
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
                  <div
                    className="viewer-container relative mx-auto flex w-full select-none justify-center py-4"
                    style={{ userSelect: "none" }}
                  >
                    <canvas
                      ref={canvasRef}
                      className="shadow-lg"
                      style={{
                        maxHeight: "calc(100dvh - 96px)",
                        width: "auto",
                        height: "auto",
                        maxWidth: "100%",
                        objectFit: "contain",
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
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
                        documentDimensions={{
                          width: CANVAS_WIDTH,
                          height: CANVAS_HEIGHT,
                        }}
                        pageIndex={pageNumber - 1}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation arrows */}
            {pageNumber > 1 && (
              <button
                className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-gray-950/50 p-1 hover:bg-gray-950/75"
                onClick={goToPreviousPage}
                aria-label="Previous page"
              >
                <ChevronLeftIcon className="h-8 w-8 text-white" />
              </button>
            )}
            {pageNumber < numPages && (
              <button
                className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-gray-950/50 p-1 hover:bg-gray-950/75"
                onClick={goToNextPage}
                aria-label="Next page"
              >
                <ChevronRightIcon className="h-8 w-8 text-white" />
              </button>
            )}
          </div>

          {screenshotProtectionEnabled ? <ScreenProtector /> : null}
          {showPoweredByBanner ? <PoweredBy linkId={linkId} /> : null}
        </div>
      </div>
      <AwayPoster
        isVisible={isInactive}
        inactivityThreshold={trackingOptions.inactivityThreshold || 60000}
        onDismiss={updateActivity}
      />
    </>
  );
}
