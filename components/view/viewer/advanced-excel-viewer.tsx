import { useEffect, useRef } from "react";

import Nav, { TNavData } from "../nav";

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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        visibilityRef.current = true;
        startTimeRef.current = Date.now(); // Reset start time when page becomes visible
      } else {
        visibilityRef.current = false;
        const duration = Date.now() - startTimeRef.current;
        if (duration > 0) {
          trackPageView({
            linkId,
            documentId,
            viewId,
            duration,
            pageNumber,
            versionNumber,
            dataroomId,
            isPreview,
          });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (visibilityRef.current) {
        const duration = Date.now() - startTimeRef.current;
        trackPageView({
          linkId,
          documentId,
          viewId,
          duration,
          pageNumber,
          versionNumber,
          dataroomId,
          isPreview,
        }); // Also capture duration if component unmounts while visible
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
