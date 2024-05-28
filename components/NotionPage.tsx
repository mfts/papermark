import { useEffect, useRef, useState } from "react";
import React from "react";

import { Brand, DataroomBrand } from "@prisma/client";
import { ExtendedRecordMap } from "notion-types";
import { NotionRenderer } from "react-notion-x";
// core styles shared by all of react-notion-x (required)
import "react-notion-x/src/styles.css";

import { TDocumentData } from "./view/dataroom/dataroom-view";
import Nav from "./view/nav";

export const NotionPage = ({
  recordMap,
  rootPageId,
  viewId,
  linkId,
  documentId,
  documentName,
  versionNumber,
  brand,
  dataroomId,
  setDocumentData,
}: {
  recordMap: ExtendedRecordMap;
  rootPageId?: string;
  viewId: string;
  linkId: string;
  documentId: string;
  versionNumber: number;
  documentName?: string;
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
  dataroomId?: string;
  setDocumentData?: React.Dispatch<React.SetStateAction<TDocumentData | null>>;
}) => {
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
          trackPageView(duration);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (visibilityRef.current) {
        const duration = Date.now() - startTimeRef.current;
        trackPageView(duration); // Also capture duration if component unmounts while visible
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  async function trackPageView(duration: number = 0) {
    await fetch("/api/record_view", {
      method: "POST",
      body: JSON.stringify({
        linkId: linkId,
        documentId: documentId,
        viewId: viewId,
        duration: duration,
        pageNumber: pageNumberRef.current,
        versionNumber: versionNumber,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Function to calculate scroll percentage
  const calculateScrollPercentage = () => {
    const scrollableHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const currentScrollPosition = window.scrollY;
    return (currentScrollPosition / scrollableHeight) * 100;
  };

  // Function to handle scroll events
  const handleScroll = () => {
    const scrollPercent = calculateScrollPercentage();
    setMaxScrollPercentage((prevMax) => Math.max(prevMax, scrollPercent));

    const data = {
      x: window.scrollX,
      y: window.scrollY,
      scrollPercentage: scrollPercent,
      type: "scroll",
    };

    // TODO: Store data for later use with heatmap.js
  };

  useEffect(() => {
    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [maxScrollPercentage]);

  if (!recordMap) {
    return null;
  }

  return (
    <>
      <div className="bg-white">
        <Nav
          brand={brand}
          documentName={documentName}
          isDataroom={dataroomId ? true : false}
          setDocumentData={setDocumentData}
          type="notion"
        />

        <div>
          <NotionRenderer
            recordMap={recordMap}
            fullPage={true}
            darkMode={false}
            rootPageId={rootPageId}
            disableHeader={true}
            components={{
              PageLink: (props: {
                href: any;
                children:
                  | string
                  | number
                  | boolean
                  | React.ReactElement<
                      any,
                      string | React.JSXElementConstructor<any>
                    >
                  | React.ReactPortal
                  | null
                  | undefined;
              }) => {
                return <div className="notion-page-link">{props.children}</div>;
              },
            }}
          />
        </div>
      </div>
    </>
  );
};
