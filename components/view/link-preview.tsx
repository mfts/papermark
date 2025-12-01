import { useEffect, useState } from "react";

import { ExternalLink } from "lucide-react";

import { Brand } from "@prisma/client";

import { Button } from "@/components/ui/button";

import Nav, { TNavData } from "./nav";

interface LinkPreviewProps {
  linkUrl: string;
  linkName: string;
  brand?: Partial<Brand> | null;
  onContinue: () => void;
  navData: TNavData;
}

export default function LinkPreview({
  linkUrl,
  linkName,
  brand,
  onContinue,
  navData,
}: LinkPreviewProps) {
  const [domain, setDomain] = useState<string>("");

  useEffect(() => {
    if (!linkUrl) {
      console.warn("LinkPreview: linkUrl is missing", { linkUrl, linkName });
      return;
    }
    
    try {
      const url = new URL(linkUrl);
      setDomain(url.hostname.replace("www.", ""));
    } catch (e) {
      // If URL parsing fails, try to extract domain from string
      const match = linkUrl.match(/https?:\/\/([^\/]+)/);
      if (match) {
        setDomain(match[1].replace("www.", ""));
      } else {
        setDomain(linkUrl.length > 50 ? linkUrl.substring(0, 50) + "..." : linkUrl);
      }
    }
  }, [linkUrl, linkName]);

  return (
    <>
      <Nav pageNumber={1} numPages={1} navData={navData} />
      <div
        style={{ height: "calc(100dvh - 64px)" }}
        className="relative flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900"
      >
        <div className="flex flex-col items-center space-y-6 p-8 text-center">
          <div className="rounded-full bg-gray-100 p-6 dark:bg-gray-800">
            <ExternalLink className="h-12 w-12 text-gray-600 dark:text-gray-300" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {domain || linkName || "External Link"}
          </h2>
          <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
            You&apos;re leaving Papermark. If you trust this link, click to continue.
          </p>
          {linkUrl ? (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block cursor-pointer break-all text-sm font-medium text-blue-600 hover:text-blue-700 underline transition-colors dark:text-blue-400 dark:hover:text-blue-300"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onContinue();
              }}
            >
              {linkUrl}
            </a>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Link URL not available
            </p>
          )}
          <Button
            onClick={onContinue}
            className="w-full max-w-md space-x-2"
            size="lg"
            disabled={!linkUrl}
          >
            <ExternalLink className="h-4 w-4" />
            <span>Continue to {domain || "link"}</span>
          </Button>
        </div>
      </div>
    </>
  );
}

