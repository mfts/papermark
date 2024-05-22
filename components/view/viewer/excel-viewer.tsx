import React, { useEffect, useRef, useState } from "react";

import "@/public/vendor/handsontable/handsontable.full.min.css";

// Define the type for the JSON data
type SheetData = { [key: string]: any };

export const ExcelViewer = ({
  columns,
  data,
}: {
  columns: string[];
  data: SheetData[];
}) => {
  const [availableWidth, setAvailableWidth] = useState<number>(200);
  const [availableHeight, setAvailableHeight] = useState<number>(200);
  const [handsontableLoaded, setHandsontableLoaded] = useState<boolean>(true);

  const hotRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // @ts-ignore
  const hotInstanceRef = useRef<Handsontable | null>(null);

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
    if (handsontableLoaded && data.length && columns.length) {
      if (hotInstanceRef.current) {
        hotInstanceRef.current.destroy();
      }

      console.log("data", data);
      console.log("columns", columns);

      // @ts-ignore
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
      <div
        style={{ height: "calc(100vh - 64px)" }}
        className="flex h-screen items-center justify-center"
        ref={containerRef}
      >
        <div ref={hotRef}></div>
      </div>
    </>
  );
};
