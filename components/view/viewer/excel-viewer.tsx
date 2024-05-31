import { useEffect, useRef, useState } from "react";
import React from "react";

import "@/public/vendor/handsontable/handsontable.full.min.css";
import { Brand, DataroomBrand } from "@prisma/client";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { TDocumentData } from "../dataroom/dataroom-view";
import Nav from "../nav";

// Define the type for the JSON data
type RowData = { [key: string]: any };
type SheetData = {
  sheetName: string;
  columnData: string[];
  rowData: RowData[];
};

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
  sheetData,
  brand,
  dataroomId,
  setDocumentData,
}: {
  linkId: string;
  viewId: string;
  documentId: string;
  documentName: string;
  versionNumber: number;
  sheetData: SheetData[];
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
  dataroomId?: string;
  setDocumentData?: React.Dispatch<React.SetStateAction<TDocumentData | null>>;
}) {
  const [availableWidth, setAvailableWidth] = useState<number>(200);
  const [availableHeight, setAvailableHeight] = useState<number>(200);
  const [handsontableLoaded, setHandsontableLoaded] = useState<boolean>(false);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState<number>(0);

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
      setAvailableWidth(Math.max(offset.width, 200));
      setAvailableHeight(Math.max(offset.height - 50, 200));
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
          pageNumber: selectedSheetIndex + 1,
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
          pageNumber: selectedSheetIndex + 1,
          versionNumber,
          dataroomId,
        }); // Also capture duration if component unmounts while visible
        startTimeRef.current = Date.now();
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [selectedSheetIndex]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!visibilityRef.current) return;

      const duration = Date.now() - startTimeRef.current;
      trackPageView({
        linkId,
        documentId,
        viewId,
        duration,
        pageNumber: selectedSheetIndex + 1,
        versionNumber,
        dataroomId,
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [selectedSheetIndex]);

  useEffect(() => {
    if (handsontableLoaded && sheetData.length) {
      if (hotInstanceRef.current) {
        hotInstanceRef.current.destroy();
      }

      const { columnData, rowData } = sheetData[selectedSheetIndex];

      // @ts-ignore - Handsontable import has not types
      hotInstanceRef.current = new Handsontable(hotRef.current!, {
        data: rowData,
        readOnly: true,
        disableVisualSelection: true,
        comments: false,
        contextMenu: false,
        colHeaders: columnData,
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
  }, [
    handsontableLoaded,
    sheetData,
    selectedSheetIndex,
    availableHeight,
    availableWidth,
  ]);

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
        style={{ height: "calc(100dvh - 64px)" }}
        className="mx-2 flex h-screen flex-col sm:mx-6 lg:mx-8"
        ref={containerRef}
      >
        <div className="" ref={hotRef}></div>
        <div className="flex max-w-fit divide-x divide-gray-200 overflow-x-scroll whitespace-nowrap rounded-b-sm bg-[#f0f0f0] px-1 ">
          {sheetData.map((sheet, index) => (
            <div className="px-1" key={sheet.sheetName}>
              <Button
                onClick={() => setSelectedSheetIndex(index)}
                className={cn(
                  "mb-1 rounded-none rounded-b-sm bg-[#f0f0f0] font-normal text-gray-950 hover:bg-gray-50",
                  index === selectedSheetIndex &&
                    "bg-white font-medium text-black ring-1 ring-gray-500 hover:bg-white",
                )}
              >
                {sheet.sheetName}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
