import { useEffect, useRef, useState } from "react";

import "@/public/vendor/handsontable/handsontable.full.min.css";
import { Brand, DataroomBrand } from "@prisma/client";

import { TDocumentData } from "../dataroom/dataroom-view";
import Nav from "../nav";

// Define the type for the JSON data
type SheetData = { [key: string]: any };

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

export default function ExcelViewer({
  linkId,
  viewId,
  documentId,
  documentName,
  versionNumber,
  columns,
  data,
  brand,
  dataroomId,
  setDocumentData,
}: {
  linkId: string;
  viewId: string;
  documentId: string;
  documentName: string;
  versionNumber: number;
  columns: string[];
  data: SheetData[];
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
  dataroomId?: string;
  setDocumentData?: (data: TDocumentData) => void;
}) {
  const [availableWidth, setAvailableWidth] = useState<number>(200);
  const [availableHeight, setAvailableHeight] = useState<number>(200);
  const [handsontableLoaded, setHandsontableLoaded] = useState<boolean>(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/handsontable/6.2.2/handsontable.full.min.js";
    script.async = true;
    script.onload = () => {
      setHandsontableLoaded(true);
    };
    script.onerror = () => {
      console.error("Failed to load Handsontable script.");
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const hotRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // @ts-ignore - Handsontable import has not types
  const hotInstanceRef = useRef<Handsontable | null>(null);
  const startTimeRef = useRef(Date.now());
  const visibilityRef = useRef<boolean>(true);

  const calculateSize = () => {
    if (containerRef.current) {
      const offset = containerRef.current.getBoundingClientRect();
      setAvailableWidth(Math.max(offset.width - 60, 200));
      setAvailableHeight(Math.max(offset.height - 10, 200));
    }
  };

  useEffect(() => {
    const handleResize = () => {
      calculateSize();
    };

    window.addEventListener("resize", handleResize);
    calculateSize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        visibilityRef.current = true;
        startTimeRef.current = Date.now(); // Reset start time when page becomes visible
      } else {
        visibilityRef.current = false;
        const duration = Date.now() - startTimeRef.current;
        trackPageView({
          linkId,
          documentId,
          viewId,
          duration,
          pageNumber: 1,
          versionNumber,
          dataroomId,
        });
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
          pageNumber: 1,
          versionNumber,
          dataroomId,
        }); // Also capture duration if component unmounts while visible
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const duration = Date.now() - startTimeRef.current;
      trackPageView({
        linkId,
        documentId,
        viewId,
        duration,
        pageNumber: 1,
        versionNumber,
        dataroomId,
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (handsontableLoaded && data.length && columns.length) {
      if (hotInstanceRef.current) {
        hotInstanceRef.current.destroy();
      }

      // @ts-ignore - Handsontable import has not types
      hotInstanceRef.current = new Handsontable(hotRef.current!, {
        data: data,
        readOnly: true,
        disableVisualSelection: true,
        comments: false,
        contextMenu: false,
        colHeaders: columns,
        rowHeaders: true,
        manualColumnResize: true,
        width: availableWidth,
        height: availableHeight,
        rowHeights: 23,
        stretchH: "none",
        viewportRowRenderingOffset: 10,
        viewportColumnRenderingOffset: 2,
        readOnlyCellClassName: "",
        // modifyColWidth: (width: number) => {
        //   if (width > 300) {
        //     return 300;
        //   }
        // },
      });
    }
  }, [handsontableLoaded, data, columns, availableHeight, availableWidth]);

  return (
    <>
      <Nav
        brand={brand}
        documentName={documentName}
        isDataroom={dataroomId ? true : false}
        setDocumentData={setDocumentData}
        type="sheet"
      />
      <div
        style={{ height: "calc(100vh - 64px)" }}
        className="flex h-screen items-center justify-center"
        ref={containerRef}
      >
        <div ref={hotRef}></div>
      </div>
    </>
  );
}
