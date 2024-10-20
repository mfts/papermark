import { useEffect, useRef, useState } from "react";

import { Brand, DataroomBrand } from "@prisma/client";

import { TDocumentData } from "../dataroom/dataroom-view";
import Nav from "../nav";

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
  viewId,
  linkId,
  documentId,
  documentName,
  allowDownload,
  versionNumber,
  brand,
  dataroomId,
  setDocumentData,
  isPreview,
}: {
  linkId: string;
  viewId?: string;
  documentId: string;
  documentName: string;
  versionNumber: number;
  file: string;
  allowDownload: boolean;
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
  dataroomId?: string;
  setDocumentData?: React.Dispatch<React.SetStateAction<TDocumentData | null>>;
  isPreview?: boolean;
}) {
  const [pageNumber, setPageNumber] = useState<number>(1); // start on first page
  const [maxScrollPercentage, setMaxScrollPercentage] = useState<number>(0);

  const startTimeRef = useRef(Date.now());
  const pageNumberRef = useRef<number>(pageNumber);
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
      <Nav
        brand={brand}
        documentName={documentName}
        isDataroom={dataroomId ? true : false}
        setDocumentData={setDocumentData}
        type="sheet"
        isPreview={isPreview}
        allowDownload={allowDownload}
        linkId={linkId}
        documentId={documentId}
        viewId={viewId}
      />
      <div
        style={{ height: "calc(100dvh - 64px)" }}
        className="mx-2 flex h-screen flex-col sm:mx-6 lg:mx-8"
      // ref={containerRef}
      >
        <iframe
          className="h-full w-full"
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${file}&wdPrint=0`}
        ></iframe>
      </div>
    </>
  );
}
