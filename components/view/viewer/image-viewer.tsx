import { useRouter } from "next/router";

import { useEffect, useRef, useState } from "react";
import React from "react";

import { Brand, DataroomBrand } from "@prisma/client";
import {
  ReactZoomPanPinchContentRef,
  TransformComponent,
  TransformWrapper,
} from "react-zoom-pan-pinch";
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
  isVertical = false,
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
  isVertical?: boolean;
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
  const pinchRefs = useRef<(ReactZoomPanPinchContentRef | null)[]>([]);
  const imageRefs = useRef<HTMLImageElement | null>(null);

  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const { isMobile } = useMediaQuery();

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
        isDataroom={dataroomId ? true : false}
        setDocumentData={setDocumentData}
        documentRefs={pinchRefs}
        isMobile={isMobile}
        isPreview={isPreview}
        hasWatermark={watermarkConfig ? true : false}
      />
      <div
        style={{ height: "calc(100dvh - 64px)" }}
        className="relative flex items-center"
      >
        <div
          className={cn(
            "relative flex h-full w-full flex-row",
            !isWindowFocused &&
              screenshotProtectionEnabled &&
              "blur-xl transition-all duration-300",
          )}
          ref={containerRef}
        >
          <div
            className="flex w-full flex-row justify-center"
            onContextMenu={handleContextMenu}
          >
            <TransformWrapper
              initialScale={scale}
              initialPositionX={0}
              initialPositionY={0}
              disabled={isMobile}
              panning={{
                lockAxisY: false,
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
                pinchRefs.current[0] = ref;
              }}
              customTransform={(x: number, y: number, scale: number) => {
                // Keep the translateY value constant
                if (isVertical) {
                  const transform = `translate(${x}px, ${0 * y * -2}px) scale(${scale})`;
                  return transform;
                }
                const transform = `translate(${x}px, ${y}px) scale(${scale})`;
                return transform;
              }}
            >
              <TransformComponent
                wrapperClass={cn(
                  "!h-full",
                  isMobile
                    ? "!overflow-x-clip !overflow-y-clip"
                    : "!overflow-x-visible !overflow-y-clip",
                )}
                contentClass="!h-full"
              >
                <div className="relative my-auto block w-full">
                  <img
                    className="!pointer-events-auto object-contain"
                    style={{
                      maxHeight: "calc(100dvh - 64px)",
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
              </TransformComponent>
            </TransformWrapper>
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
