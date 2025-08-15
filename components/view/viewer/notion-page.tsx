import dynamic from "next/dynamic";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import React from "react";

import { Slash } from "lucide-react";
import { ExtendedRecordMap } from "notion-types";
import { useQueryState } from "nuqs";
import { NotionRenderer } from "react-notion-x";
// core styles shared by all of react-notion-x (required)
import "react-notion-x/src/styles.css";

import { useSafePageViewTracker } from "@/lib/tracking/safe-page-view-tracker";
import { getTrackingOptions } from "@/lib/tracking/tracking-config";
import { NotionTheme } from "@/lib/types";
import { cn } from "@/lib/utils";
import { determineTextColor } from "@/lib/utils/determine-text-color";

import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Portal } from "@/components/ui/portal";

import { ScreenProtector } from "../../view/ScreenProtection";
import Nav, { TNavData } from "../../view/nav";
import { AwayPoster } from "./away-poster";

// custom styles for notion
import "@/styles/custom-notion-styles.css";

const Collection = dynamic(() =>
  import("react-notion-x/build/third-party/collection").then(
    (m) => m.Collection,
  ),
);

const Code = dynamic(() =>
  import("react-notion-x/build/third-party/code").then((m) => m.Code),
);

export const NotionPage = ({
  recordMap,
  versionNumber,
  theme,
  screenshotProtectionEnabled,
  navData,
}: {
  recordMap: ExtendedRecordMap;
  versionNumber: number;
  theme?: NotionTheme | null;
  screenshotProtectionEnabled: boolean;
  navData: TNavData;
}) => {
  const { isPreview, linkId, documentId, viewId, brand } = navData;
  const [pageNumber, setPageNumber] = useState<number>(1); // start on first page
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
  const trackingOptions = getTrackingOptions();
  const {
    trackPageViewSafely,
    resetTrackingState,
    startIntervalTracking,
    stopIntervalTracking,
    getActiveDuration,
    isInactive,
    updateActivity,
  } = useSafePageViewTracker({
    ...trackingOptions,
    externalStartTimeRef: startTimeRef,
  });

  // Start interval tracking when component mounts
  useEffect(() => {
    const trackingData = {
      linkId: linkId,
      documentId: documentId,
      viewId: viewId,
      pageNumber: pageNumberRef.current,
      versionNumber: versionNumber,
      isPreview: isPreview,
      dataroomId: navData?.dataroomId || undefined,
    };

    startIntervalTracking(trackingData);

    return () => {
      stopIntervalTracking();
    };
  }, [
    linkId,
    documentId,
    viewId,
    versionNumber,
    isPreview,
    startIntervalTracking,
    stopIntervalTracking,
  ]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        visibilityRef.current = true;
        startTimeRef.current = Date.now(); // Reset start time when page becomes visible
        resetTrackingState();

        // Restart interval tracking
        const trackingData = {
          linkId: linkId,
          documentId: documentId,
          viewId: viewId,
          pageNumber: pageNumberRef.current,
          versionNumber: versionNumber,
          isPreview: isPreview,
          dataroomId: navData?.dataroomId || undefined,
        };
        startIntervalTracking(trackingData);
      } else {
        visibilityRef.current = false;
        stopIntervalTracking();

        // Track final duration using activity-aware calculation
        const duration = getActiveDuration();
        trackPageViewSafely(
          {
            linkId: linkId,
            documentId: documentId,
            viewId: viewId,
            duration: duration,
            pageNumber: pageNumberRef.current,
            versionNumber: versionNumber,
            isPreview: isPreview,
            dataroomId: navData?.dataroomId || undefined,
          },
          true,
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    linkId,
    documentId,
    viewId,
    versionNumber,
    isPreview,
    navData,
    trackPageViewSafely,
    resetTrackingState,
    startIntervalTracking,
    stopIntervalTracking,
    getActiveDuration,
  ]);

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
          // Scroll to top when changing subpages
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        setLoading(true);
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
          // Scroll to top after loading new subpage
          window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error) {
          console.error("Error fetching subpage:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setRecordMapState(recordMap);
        // get the first item in the recordMap.block object
        const firstBlockId = Object.keys(recordMap.block)[0];
        const firstBlock = recordMap.block[firstBlockId];
        setTitle(firstBlock?.value?.properties?.title?.[0]?.[0] || "Untitled");
        // Scroll to top when returning to main page
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [subPageId, recordMap],
  );

  // Use useMemo to memoize the effect of fetching the subpage
  useMemo(() => {
    fetchSubPage(subPageId);
  }, [subPageId, fetchSubPage]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      stopIntervalTracking();
      const duration = getActiveDuration();
      trackPageViewSafely(
        {
          linkId: linkId,
          documentId: documentId,
          viewId: viewId,
          duration: duration,
          pageNumber: pageNumberRef.current,
          versionNumber: versionNumber,
          isPreview: isPreview,
          dataroomId: navData?.dataroomId || undefined,
        },
        true,
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    linkId,
    documentId,
    viewId,
    versionNumber,
    isPreview,
    trackPageViewSafely,
    stopIntervalTracking,
    getActiveDuration,
  ]);

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

  // Add a function to handle smooth scrolling to elements
  const scrollToHashElement = useCallback(() => {
    const hash = window.location.hash;
    if (hash) {
      // Remove the # from the hash
      const elementId = hash.slice(1);

      // Create observer to watch for position changes
      const observer = new MutationObserver((mutations, obs) => {
        const element = document.getElementById(elementId);
        if (element) {
          // Get current position
          const rect = element.getBoundingClientRect();
          const absoluteTop = window.scrollY + rect.top; // Account for header

          window.scrollTo({
            top: absoluteTop,
            behavior: "smooth",
          });
        }
      });

      // Start observing the document with the configured parameters
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      // Always observe for at least 2 seconds to catch any layout shifts
      setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
          const rect = element.getBoundingClientRect();
          const absoluteTop = window.scrollY + rect.top;
          window.scrollTo({
            top: absoluteTop,
            behavior: "smooth",
          });
        }
        observer.disconnect();
      }, 2000);
    }
  }, []);

  // Handle initial load and hash changes
  useEffect(() => {
    scrollToHashElement();

    window.addEventListener("hashchange", scrollToHashElement);
    return () => {
      window.removeEventListener("hashchange", scrollToHashElement);
    };
  }, [scrollToHashElement]);

  if (!recordMap) {
    return null;
  }

  return (
    <div className="bg-white">
      <Nav type="notion" navData={navData} />

      <Portal
        containerId="view-breadcrump-portal"
        className="flex items-center gap-1.5"
      >
        <>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="cursor-pointer underline underline-offset-4"
              onClick={() => setSubPageId(null)}
              style={{
                color: determineTextColor(brand?.brandColor),
              }}
            >
              {title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          {subPageId ? (
            <>
              <BreadcrumbSeparator>
                <Slash />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage
                  className="font-medium"
                  style={{
                    color: determineTextColor(brand?.brandColor),
                  }}
                >
                  {subTitle}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : null}
        </>
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
          disableHeader={true}
          components={{
            Collection,
            Code,
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
      <AwayPoster
        isVisible={isInactive}
        inactivityThreshold={getTrackingOptions().inactivityThreshold}
        onDismiss={updateActivity}
      />
    </div>
  );
};
