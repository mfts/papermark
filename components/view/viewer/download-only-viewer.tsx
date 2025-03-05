import { useRouter } from "next/router";

import { useEffect, useRef } from "react";

import { Brand, DataroomBrand } from "@prisma/client";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { TDocumentData } from "../dataroom/dataroom-view";
import Nav from "../nav";

const trackPageView = async (data: {
  linkId: string;
  documentId: string;
  viewId?: string;
  duration: number;
  pageNumber: number;
  versionNumber: number;
  dataroomId?: string;
  isPreview?: boolean;
}) => {
  // If the view is a preview, do not track the view
  if (data.isPreview) return;

  await fetch("/api/record_view", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export default function DownloadOnlyViewer({
  file,
  linkId,
  documentId,
  viewId,
  allowDownload,
  versionNumber,
  brand,
  documentName,
  isPreview,
  dataroomId,
  setDocumentData,
}: {
  file: string;
  linkId: string;
  documentId: string;
  viewId?: string;
  allowDownload: boolean;
  versionNumber: number;
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
  documentName?: string;
  isPreview?: boolean;
  dataroomId?: string;
  setDocumentData?: React.Dispatch<React.SetStateAction<TDocumentData | null>>;
}) {
  const router = useRouter();
  const startTimeRef = useRef(Date.now());
  const visibilityRef = useRef<boolean>(true);

  useEffect(() => {
    // Remove token and email query parameters on component mount
    const removeQueryParams = (queries: string[]) => {
      const currentQuery = { ...router.query };
      const currentPath = router.asPath.split("?")[0];
      queries.map((query) => delete currentQuery[query]);

      router.replace(
        {
          pathname: currentPath,
          query: currentQuery,
        },
        undefined,
        { shallow: true },
      );
    };

    if (router.query.token) {
      removeQueryParams(["token", "email", "domain", "slug", "linkId"]);
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        visibilityRef.current = true;
        startTimeRef.current = Date.now();
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
          isPreview,
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [documentId, linkId, viewId, versionNumber, dataroomId, isPreview]);

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
        isPreview,
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [documentId, linkId, viewId, versionNumber, dataroomId, isPreview]);

  const downloadFile = async () => {
    if (isPreview) {
      toast.error("You cannot download documents in preview mode.");
      return;
    }
    if (!allowDownload) return;
    try {
      const response = await fetch(`/api/links/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ linkId, viewId }),
      });

      if (!response.ok) {
        toast.error("Error downloading file");
        return;
      }
      const { downloadUrl } = await response.json();

      window.open(downloadUrl, "_blank");
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  return (
    <>
      <Nav
        pageNumber={1}
        numPages={1}
        allowDownload={allowDownload}
        brand={brand}
        viewId={viewId}
        linkId={linkId}
        documentId={documentId}
        documentName={documentName}
        isPreview={isPreview}
        isDataroom={dataroomId ? true : false}
        setDocumentData={setDocumentData}
      />
      <div
        style={{ height: "calc(100dvh - 64px)" }}
        className="relative flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900"
      >
        <div className="flex flex-col items-center space-y-6 p-8 text-center">
          <div className="rounded-full bg-gray-100 p-6 dark:bg-gray-800">
            <Download className="h-12 w-12 text-gray-600 dark:text-gray-300" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">
            {documentName || "Download Document"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This document is available for download only
          </p>
          {allowDownload && (
            <Button onClick={downloadFile} className="w-full space-x-2">
              <Download className="h-4 w-4" />
              <span>Download Now</span>
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
