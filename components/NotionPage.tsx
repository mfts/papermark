import { useEffect, useRef, useState } from "react";
import { ExtendedRecordMap } from "notion-types";
import { NotionRenderer } from "react-notion-x";
// core styles shared by all of react-notion-x (required)
import "react-notion-x/src/styles.css";
import Nav from "./view/nav";
import { Brand } from "@prisma/client";

export const NotionPage = ({
  recordMap,
  rootPageId,
  viewId,
  linkId,
  documentId,
  versionNumber,
  brand,
}: {
  recordMap: ExtendedRecordMap;
  rootPageId?: string;
  viewId: string;
  linkId: string;
  documentId: string;
  versionNumber: number;
  brand?: Brand;
}) => {
  const [pageNumber, setPageNumber] = useState<number>(1); // start on first page
  const [maxScrollPercentage, setMaxScrollPercentage] = useState<number>(0);

  const startTimeRef = useRef(Date.now());
  const pageNumberRef = useRef<number>(pageNumber);

  useEffect(() => {
    startTimeRef.current = Date.now(); // update the start time for the new page

    // when component unmounts, calculate duration and track page view
    return () => {
      const endTime = Date.now();
      const duration = Math.round(endTime - startTimeRef.current);
      trackPageView(duration);
    };
  }, [pageNumber]); // monitor pageNumber for changes

  // Send the last page view when the user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      const endTime = Date.now();
      const duration = Math.round(endTime - startTimeRef.current);
      trackPageView(duration);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
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
        <Nav brand={brand} />

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
