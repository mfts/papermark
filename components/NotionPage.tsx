import dynamic from "next/dynamic";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import React from "react";

import { Brand, DataroomBrand } from "@prisma/client";
import { Slash } from "lucide-react";
import { ExtendedRecordMap } from "notion-types";
import { useQueryState } from "nuqs";
import { NotionRenderer } from "react-notion-x";
// core styles shared by all of react-notion-x (required)
import "react-notion-x/src/styles.css";

import { NotionTheme } from "@/lib/types";
import { cn } from "@/lib/utils";
import { determineTextColor } from "@/lib/utils/determine-text-color";

// custom styles for notion
import "@/styles/custom-notion-styles.css";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Portal } from "./ui/portal";
import { ScreenProtector } from "./view/ScreenProtection";
import { TDocumentData } from "./view/dataroom/dataroom-view";
import Nav from "./view/nav";

const Collection = dynamic(() =>
  import("react-notion-x/build/third-party/collection").then(
    (m) => m.Collection,
  ),
);

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
  isPreview,
  theme,
  screenshotProtectionEnabled,
}: {
  recordMap: ExtendedRecordMap;
  rootPageId?: string;
  viewId?: string;
  linkId: string;
  documentId: string;
  versionNumber: number;
  documentName?: string;
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
  dataroomId?: string;
  setDocumentData?: React.Dispatch<React.SetStateAction<TDocumentData | null>>;
  isPreview?: boolean;
  theme?: NotionTheme | null;
  screenshotProtectionEnabled: boolean;
}) => {
  const [pageNumber, setPageNumber] = useState<number>(1); // start on first page
  const [maxScrollPercentage, setMaxScrollPercentage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [subPageId, setSubPageId] = useQueryState("pageid", {
    history: "push",
    scroll: true,
  });
  const [subTitle, setSubTitle] = useState<string>("");
  const [title, setTitle] = useState<string>("");

  const [isWindowFocused, setIsWindowFocused] = useState(true);

  const [recordMapState, setRecordMapState] =
    useState<ExtendedRecordMap>(recordMap);

  // Create a cache object to store fetched recordMaps
  const recordMapCache = useRef<{ [key: string]: ExtendedRecordMap }>({});

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

  // Memoize the fetchSubPage function
  const fetchSubPage = useCallback(
    async (pageId: string | null) => {
      if (pageId) {
        // Check if the recordMap is already in the cache
        if (recordMapCache.current[pageId]) {
          const currentRecordMap = recordMapCache.current[pageId];
          setRecordMapState(currentRecordMap);
          const firstBlockId = Object.keys(currentRecordMap.block)[0];
          const firstBlock = currentRecordMap.block[firstBlockId];
          setSubTitle(
            firstBlock?.value?.properties?.title?.[0]?.[0] || "Untitled",
          );
          return;
        }

        setLoading(true);
        console.log("Fetching subPageId", pageId);
        try {
          const response = await fetch("/api/file/notion", {
            method: "POST",
            body: JSON.stringify({ pageId }),
            headers: {
              "Content-Type": "application/json",
            },
          });
          const newRecordMap = await response.json();
          // Store the fetched recordMap in the cache
          recordMapCache.current[pageId] = newRecordMap;
          setRecordMapState(newRecordMap);
          const firstBlockId = Object.keys(newRecordMap.block)[0];
          const firstBlock = recordMap.block[firstBlockId];
          setSubTitle(
            firstBlock?.value?.properties?.title?.[0]?.[0] || "Untitled",
          );
        } catch (error) {
          console.error("Error fetching subpage:", error);
        } finally {
          setLoading(false);
        }
      } else {
        console.log("subPageId is", pageId);
        setRecordMapState(recordMap);
        // get the first item in the recordMap.block object
        const firstBlockId = Object.keys(recordMap.block)[0];
        const firstBlock = recordMap.block[firstBlockId];
        setTitle(firstBlock?.value?.properties?.title?.[0]?.[0] || "Untitled");
      }
    },
    [subPageId, recordMap],
  );

  // Use useMemo to memoize the effect of fetching the subpage
  useMemo(() => {
    fetchSubPage(subPageId);
  }, [subPageId, fetchSubPage]);

  // useEffect(() => {
  //   const fetchSubPage = async () => {
  //     if (subPageId) {
  //       setLoading(true);
  //       console.log("subPageId", subPageId);
  //       const recordMap = await fetch("/api/file/notion", {
  //         method: "POST",
  //         body: JSON.stringify({ pageId: subPageId }),
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //       });
  //       setRecordMapState(await recordMap.json());
  //       setLoading(false);
  //     } else {
  //       console.log("subPageId is", subPageId);
  //       setRecordMapState(recordMap);
  //     }

  //     const duration = Date.now() - startTimeRef.current;
  //     trackPageView(duration);
  //     startTimeRef.current = Date.now();
  //   };

  //   fetchSubPage();
  // }, [subPageId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const duration = Date.now() - startTimeRef.current;
      trackPageView(duration);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [subPageId]);

  async function trackPageView(duration: number = 0) {
    console.log("tracking page view");
    if (isPreview) return;

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

  // // Function to calculate scroll percentage
  // const calculateScrollPercentage = () => {
  //   const scrollableHeight =
  //     document.documentElement.scrollHeight - window.innerHeight;
  //   const currentScrollPosition = window.scrollY;
  //   return (currentScrollPosition / scrollableHeight) * 100;
  // };

  // // Function to handle scroll events
  // const handleScroll = () => {
  //   const scrollPercent = calculateScrollPercentage();
  //   setMaxScrollPercentage((prevMax) => Math.max(prevMax, scrollPercent));

  //   const data = {
  //     x: window.scrollX,
  //     y: window.scrollY,
  //     scrollPercentage: scrollPercent,
  //     type: "scroll",
  //   };

  //   // TODO: Store data for later use with heatmap.js
  // };

  // useEffect(() => {
  //   // Add scroll event listener
  //   window.addEventListener("scroll", handleScroll);

  //   // Remove event listener on cleanup
  //   return () => {
  //     window.removeEventListener("scroll", handleScroll);
  //   };
  // }, [maxScrollPercentage]);

  if (!recordMap) {
    return null;
  }

  return (
    <div className="bg-white">
      <Nav
        brand={brand}
        documentName={documentName}
        isDataroom={dataroomId ? true : false}
        setDocumentData={setDocumentData}
        type="notion"
        isPreview={isPreview}
        linkId={linkId}
        documentId={documentId}
        viewId={viewId}
      />

      <Portal containerId="view-breadcrump-portal">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer underline underline-offset-4 hover:font-medium"
                onClick={() => setSubPageId(null)}
                style={{
                  color:
                    brand && brand.brandColor
                      ? determineTextColor(brand.brandColor)
                      : "white",
                }}
              >
                {title}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <Slash />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage
                className="font-medium"
                style={{
                  color:
                    brand && brand.brandColor
                      ? determineTextColor(brand.brandColor)
                      : "white",
                }}
              >
                {subTitle}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Portal>

      {loading && <div>Loading...</div>}

      <div
        className={cn(
          !isWindowFocused &&
            screenshotProtectionEnabled &&
            "blur-xl transition-all duration-300",
        )}
      >
        <NotionRenderer
          recordMap={recordMapState}
          fullPage={true}
          darkMode={theme ? theme === "dark" : false}
          rootPageId={rootPageId}
          disableHeader={true}
          components={{
            Collection,
            PageLink: (props: {
              className: string;
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
              return (
                <div
                  className={props.className}
                  onClick={() => setSubPageId(props.href.split("/")[1])}
                >
                  {props.children}
                </div>
              );
            },
          }}
        />
      </div>
      {screenshotProtectionEnabled ? <ScreenProtector /> : null}
    </div>
  );
};
