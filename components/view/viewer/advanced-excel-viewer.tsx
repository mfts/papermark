import { useEffect, useRef } from "react";

import { useSafePageViewTracker } from "@/lib/tracking/safe-page-view-tracker";

import Nav, { TNavData } from "../nav";

export default function AdvancedExcelViewer({
  file,
  versionNumber,
  navData,
}: {
  file: string;
  versionNumber: number;
  navData: TNavData;
}) {
  const { linkId, documentId, viewId, isPreview, dataroomId, brand } = navData;
  const pageNumber = 1;

  const startTimeRef = useRef(Date.now());
  const visibilityRef = useRef<boolean>(true);

  const { trackPageViewSafely, resetTrackingState } = useSafePageViewTracker();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        visibilityRef.current = true;
        startTimeRef.current = Date.now(); // Reset start time when page becomes visible
        resetTrackingState();
      } else {
        visibilityRef.current = false;
        const duration = Date.now() - startTimeRef.current;
        if (duration > 0) {
          trackPageViewSafely(
            {
              linkId,
              documentId,
              viewId,
              duration,
              pageNumber,
              versionNumber,
              dataroomId,
              isPreview,
            },
            true,
          );
        }
      }
    };

    const handleBeforeUnload = () => {
      const duration = Date.now() - startTimeRef.current;
      if (duration > 0) {
        trackPageViewSafely(
          {
            linkId,
            documentId,
            viewId,
            duration,
            pageNumber,
            versionNumber,
            dataroomId,
            isPreview,
          },
          true,
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <>
      <Nav type="sheet" navData={navData} />
      <div
        style={{ height: "calc(100dvh - 64px)" }}
        className="relative mx-2 flex h-screen flex-col sm:mx-6 lg:mx-8"
      >
        <iframe
          className="h-full w-full"
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${file}&wdPrint=0&action=embedview&wdAllowInteractivity=False`}
        ></iframe>
        <div
          className="absolute bottom-0 left-0 right-0 z-50 h-[26px] bg-gray-950"
          style={{
            background: brand?.accentColor || "rgb(3, 7, 18)",
          }}
        />
      </div>
    </>
  );
}
