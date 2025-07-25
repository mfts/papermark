import { useCallback, useEffect, useRef, useState } from "react";

import { ExternalLinkIcon, LinkIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { ScreenProtector } from "../ScreenProtection";
import Nav, { TNavData } from "../nav";
import { PoweredBy } from "../powered-by";

import "@/styles/custom-viewer-styles.css";

// Move getDomainFromUrl outside the component
function getDomainFromUrl(url: string) {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export default function LinkViewer({
  linkUrl,
  documentName,
  versionNumber,
  navData,
  screenshotProtectionEnabled,
  showPoweredByBanner,
}: {
  linkUrl: string;
  documentName: string;
  versionNumber: number;
  navData: TNavData;
  screenshotProtectionEnabled: boolean;
  showPoweredByBanner: boolean;
}) {
  const [isOpening, setIsOpening] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const { linkId, viewId, isPreview } = navData;

  const autoRedirectTimer = useRef<number | undefined>(undefined);
  const hasRedirected = useRef(false);

  const trackLinkClick = useCallback(() => {
    if (!isPreview && viewId) {
      try {
        navigator.sendBeacon?.(
          "/api/record_link_click",
          new Blob([JSON.stringify({ viewId, linkId })], {
            type: "application/json",
          }),
        );
      } catch (error) {
        console.error("Failed to track link click:", error);
      }
    }
  }, [isPreview, viewId, linkId]);

  const redirect = useCallback(() => {
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    trackLinkClick();
    window.location.replace(linkUrl);
  }, [trackLinkClick, linkUrl]);

  useEffect(() => {
    let isMounted = true;
    setCountdown(5);
    autoRedirectTimer.current = window.setTimeout(() => {
      if (isMounted) redirect();
    }, 5000);

    const interval = window.setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);

    return () => {
      isMounted = false;
      if (autoRedirectTimer.current) {
        clearTimeout(autoRedirectTimer.current);
      }
      clearInterval(interval);
    };
  }, [redirect]);

  const handleOpenLink = async () => {
    if (autoRedirectTimer.current) {
      clearTimeout(autoRedirectTimer.current);
      autoRedirectTimer.current = undefined;
    }
    setIsOpening(true);
    await trackLinkClick();
    window.open(linkUrl, "_blank", "noopener,noreferrer");
    window.location.replace("https://www.papermark.com/home");
  };

  return (
    <>
      <Nav pageNumber={1} numPages={1} navData={navData} />
      <div
        style={{ height: "calc(100dvh - 64px)" }}
        className="relative flex items-center justify-center bg-white dark:bg-gray-950"
      >
        <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <Card className="overflow-hidden border p-0 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3 border-b border-gray-100 px-8 pb-6 pt-8 dark:border-gray-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                <LinkIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100">
                  {documentName}
                </h1>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  External Link Document
                </div>
              </div>
            </div>
            <div
              className="mx-8 mt-8 flex select-none items-center gap-4 rounded-lg border border-gray-100 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-800/50"
              style={{ userSelect: "none" }}
              onCopy={(e) => e.preventDefault()}
            >
              <ExternalLinkIcon className="h-6 w-6 flex-shrink-0 text-gray-400" />
              <div className="min-w-0 flex-1">
                <div className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {getDomainFromUrl(linkUrl)}
                </div>
                <div className="mt-0.5 break-all text-xs text-gray-500 dark:text-gray-400">
                  {linkUrl}
                </div>
              </div>
            </div>
            <div className="mx-8 mt-4 flex flex-col">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                You will be redirected to the external link in{" "}
                <span className="font-semibold">{countdown}</span> second
                {countdown !== 1 ? "s" : ""}. If you are not automatically
                redirected, please click the button below to open the link.
              </div>
            </div>

            {/* Optional alert message */}
            {/* <div className="mt-6 px-8">
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>External Link Redirection</AlertTitle>
                <AlertDescription>
                  You will be redirected to an external website. Please verify
                  that you trust the source before proceeding.
                </AlertDescription>
              </Alert>
            </div> */}

            <div className="mt-8 flex justify-center px-8 pb-10">
              <Button
                onClick={handleOpenLink}
                disabled={isOpening}
                size="lg"
                aria-label="Open external link"
                className={cn(
                  "w-full max-w-xs space-x-2",
                  isOpening && "cursor-not-allowed opacity-70",
                )}
              >
                <ExternalLinkIcon className="h-4 w-4" />
                <span>{isOpening ? "Opening..." : "Open External Link"}</span>
              </Button>
            </div>
          </Card>

          {screenshotProtectionEnabled && <ScreenProtector />}
          {showPoweredByBanner ? <PoweredBy linkId={linkId} /> : null}
        </div>
      </div>
    </>
  );
}
