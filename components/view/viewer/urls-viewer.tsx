import { useEffect, useMemo, useRef, useState } from "react";
import React from "react";

import { ExternalLink, Link } from "lucide-react";
import { toast } from "sonner";

import { useSafePageViewTracker } from "@/lib/tracking/safe-page-view-tracker";
import { getTrackingOptions } from "@/lib/tracking/tracking-config";
import { cn } from "@/lib/utils";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ScreenProtector } from "../../view/ScreenProtection";
import Nav, { TNavData } from "../../view/nav";
import { AwayPoster } from "./away-poster";

const PAGE_SIZE = 10;

export const UrlsViewer = ({
  urls,
  versionNumber,
  screenshotProtectionEnabled,
  navData,
}: {
  urls: string[];
  versionNumber: number;
  screenshotProtectionEnabled: boolean;
  navData: TNavData;
}) => {
  const { isPreview, linkId, documentId, viewId } = navData;
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const startTimeRef = useRef(Date.now());
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

  useEffect(() => {
    const trackingData = {
      linkId: linkId,
      documentId: documentId,
      viewId: viewId,
      pageNumber: 1,
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
    navData?.dataroomId,
    startIntervalTracking,
    stopIntervalTracking,
  ]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        visibilityRef.current = true;
        startTimeRef.current = Date.now();
        resetTrackingState();

        const trackingData = {
          linkId: linkId,
          documentId: documentId,
          viewId: viewId,
          pageNumber: 1,
          versionNumber: versionNumber,
          isPreview: isPreview,
          dataroomId: navData?.dataroomId || undefined,
        };
        startIntervalTracking(trackingData);
      } else {
        visibilityRef.current = false;
        stopIntervalTracking();

        const duration = getActiveDuration();
        trackPageViewSafely(
          {
            linkId: linkId,
            documentId: documentId,
            viewId: viewId,
            duration: duration,
            pageNumber: 1,
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
          pageNumber: 1,
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

  const handleLinkClick = async (url: string) => {
    if (isPreview || !viewId) return;
    try {
      await fetch("/api/record_click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          sessionId: viewId,
          linkId,
          documentId,
          viewId,
          pageNumber: "1",
          href: url,
          versionNumber,
          dataroomId: navData?.dataroomId || null,
        }),
      });
    } catch (error) {
      console.error("Failed to record link click:", error);
    }

    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (!newWindow) {
      toast.error("Please allow popups to open links");
    }
  };

  const filtered = useMemo(
    () =>
      search.trim().length === 0
        ? urls
        : urls.filter((u) => u.toLowerCase().includes(search.toLowerCase())),
    [urls, search],
  );
  const pageCount = Math.ceil(filtered?.length / PAGE_SIZE);
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  if (!urls || urls.length === 0) {
    return null;
  }

  return (
    <div className="h-full bg-white dark:bg-gray-950">
      <Nav type="notion" navData={navData} />

      <div
        className={cn(
          !isWindowFocused &&
            screenshotProtectionEnabled &&
            "blur-xl transition-all duration-300",
          "min-h-[calc(100vh-64px)]",
        )}
      >
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                <Link className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  Links
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {filtered.length} link{filtered.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>
            <div className="mt-4 w-full max-w-xs sm:mt-0">
              <input
                type="text"
                placeholder="Search links..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-800"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90">
                    <TableHead className="w-12 text-primary-foreground">
                      #
                    </TableHead>
                    <TableHead className="text-primary-foreground">
                      URL
                    </TableHead>
                    <TableHead className="w-32 text-right text-primary-foreground">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((url, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <div className="break-all text-sm text-gray-900 dark:text-gray-100">
                            {url}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => handleLinkClick(url)}
                          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginated.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="py-8 text-center text-gray-400 dark:text-gray-500"
                      >
                        No links found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {pageCount > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.max(1, p - 1));
                      }}
                      className={
                        page === 1 ? "pointer-events-none opacity-50" : ""
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(pageNum);
                          }}
                          isActive={page === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.min(pageCount, p + 1));
                      }}
                      className={
                        page === pageCount
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
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