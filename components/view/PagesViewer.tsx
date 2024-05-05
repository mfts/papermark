import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import LoadingSpinner from "@/components/ui/loading-spinner";
import BlankImg from "@/public/_static/blank.gif";
import Nav from "./nav";
import Toolbar from "./toolbar";
import { Brand, DataroomBrand } from "@prisma/client";
import { useRouter } from "next/router";
import { PoweredBy } from "./powered-by";
import Question from "./question";
import { cn } from "@/lib/utils";
import { ScreenProtector } from "./ScreenProtection";
import { toast } from "sonner";

const DEFAULT_PRELOADED_IMAGES_NUM = 10;

export default function PagesViewer({
  pages,
  linkId,
  documentId,
  viewId,
  assistantEnabled,
  allowDownload,
  feedbackEnabled,
  screenshotProtectionEnabled,
  versionNumber,
  brand,
  documentName,
  dataroomId,
  setDocumentData,
  showPoweredByBanner,
  enableQuestion = false,
  feedback,
}: {
  pages: { file: string; pageNumber: string; embeddedLinks: string[] }[];
  linkId: string;
  documentId: string;
  viewId: string;
  assistantEnabled?: boolean;
  allowDownload: boolean;
  feedbackEnabled: boolean;
  screenshotProtectionEnabled: boolean;
  versionNumber: number;
  brand?: Brand | DataroomBrand;
  documentName?: string;
  dataroomId?: string;
  setDocumentData?: (data: any) => void;
  showPoweredByBanner?: boolean;
  enableQuestion?: boolean | null;
  feedback?: {
    id: string;
    data: { question: string; type: string };
  } | null;
}) {
  const router = useRouter();
  const numPages = pages.length;
  const numPagesWithFeedback =
    enableQuestion && feedback ? numPages + 1 : numPages;
  const pageQuery = router.query.p ? Number(router.query.p) : 1;

  const [pageNumber, setPageNumber] = useState<number>(() =>
    pageQuery >= 1 && pageQuery <= numPages ? pageQuery : 1,
  ); // start on first page

  const [loadedImages, setLoadedImages] = useState<boolean[]>(
    new Array(numPages).fill(false),
  );

  const [submittedFeedback, setSubmittedFeedback] = useState<boolean>(false);

  const startTimeRef = useRef(Date.now());
  const pageNumberRef = useRef<number>(pageNumber);
  const visibilityRef = useRef<boolean>(true);

  // Update the previous page number after the effect hook has run
  useEffect(() => {
    pageNumberRef.current = pageNumber;
  }, [pageNumber]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        visibilityRef.current = true;
        startTimeRef.current = Date.now(); // Reset start time when the page becomes visible again
      } else {
        visibilityRef.current = false;
        if (pageNumber <= numPages) {
          const duration = Date.now() - startTimeRef.current;
          trackPageView(duration);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pageNumber, numPages]); // track page view when the page becomes visible or hidden on mount and unmount

  useEffect(() => {
    startTimeRef.current = Date.now();

    return () => {
      if (visibilityRef.current && pageNumber <= numPages) {
        // Only track the page view if the page is visible
        const duration = Date.now() - startTimeRef.current;
        trackPageView(duration);
      }
    };
  }, [pageNumber, numPages]); // Track page view when the page number changes

  useEffect(() => {
    setLoadedImages((prev) =>
      prev.map((loaded, index) =>
        index < DEFAULT_PRELOADED_IMAGES_NUM ? true : loaded,
      ),
    );
  }, []);

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault(); // Prevent default behavior
        event.stopPropagation(); // Stop propagation
        goToNextPage();
        break;
      case "ArrowLeft":
        event.preventDefault(); // Prevent default behavior
        event.stopPropagation(); // Stop propagation
        goToPreviousPage();
        break;
      default:
        break;
    }
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!screenshotProtectionEnabled) {
      return null;
    }

    event.preventDefault();
    // Close menu on click anywhere
    const clickHandler = () => {
      document.removeEventListener("click", clickHandler);
    };
    document.addEventListener("click", clickHandler);

    toast.info("Context menu has been disabled.");
  };

  // Function to preload next image
  const preloadImage = (index: number) => {
    if (index < numPages && !loadedImages[index]) {
      const newLoadedImages = [...loadedImages];
      newLoadedImages[index] = true;
      setLoadedImages(newLoadedImages);
    }
  };

  // Navigate to previous page
  const goToPreviousPage = () => {
    if (pageNumber <= 1) return;
    if (pageNumber === numPagesWithFeedback)
      return setPageNumber(pageNumber - 1);
    setPageNumber(pageNumber - 1);
  };

  // Navigate to next page and preload next image
  const goToNextPage = () => {
    if (pageNumber >= numPagesWithFeedback) return;
    preloadImage(DEFAULT_PRELOADED_IMAGES_NUM - 1 + pageNumber); // Preload the next image
    setPageNumber(pageNumber + 1);
  };

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
        dataroomId: dataroomId,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  useEffect(() => {
    // when the component mounts, attach the event listener
    document.addEventListener("keydown", handleKeyDown);

    // when the component unmounts, detach the event listener
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, goToNextPage, goToPreviousPage]);

  return (
    <>
      <Nav
        pageNumber={pageNumber}
        numPages={numPagesWithFeedback}
        assistantEnabled={assistantEnabled}
        allowDownload={allowDownload}
        brand={brand}
        viewId={viewId}
        linkId={linkId}
        documentName={documentName}
        embeddedLinks={pages[pageNumber - 1]?.embeddedLinks}
        isDataroom={dataroomId ? true : false}
        setDocumentData={setDocumentData}
      />
      <div
        style={{ height: "calc(100vh - 64px)" }}
        className="flex items-center relative"
      >
        <button
          onClick={goToPreviousPage}
          disabled={pageNumber == 1}
          className={cn(
            "absolute left-0 h-[calc(100vh - 64px)] px-2 py-24 z-20",
            pageNumber == 1 && "hidden",
          )}
        >
          <span className="sr-only">Previous</span>
          <div className="bg-gray-950/50 hover:bg-gray-950/75 rounded-full relative flex items-center justify-center p-1">
            <ChevronLeftIcon
              className="h-10 w-10 text-white"
              aria-hidden="true"
            />
          </div>
        </button>
        <button
          onClick={goToNextPage}
          disabled={pageNumber >= numPagesWithFeedback}
          className={cn(
            "absolute right-0 h-[calc(100vh - 64px)] px-2 py-24 z-20",
            pageNumber >= numPagesWithFeedback && "hidden",
          )}
        >
          <span className="sr-only">Next</span>
          <div className="bg-gray-950/50 hover:bg-gray-950/75 rounded-full relative flex items-center justify-center p-1">
            <ChevronRightIcon
              className="h-10 w-10 text-white"
              aria-hidden="true"
            />
          </div>
        </button>

        <div
          className="flex justify-center mx-auto relative h-full w-full"
          onContextMenu={handleContextMenu}
        >
          {pageNumber <= numPages &&
            (pages && loadedImages[pageNumber - 1] ? (
              pages.map((page, index) => {
                // served from cloudfront, then use img tag otherwise use next/image
                if (page.file.toLowerCase().includes("files.papermark.io")) {
                  return (
                    <img
                      key={index}
                      className={`object-contain mx-auto ${
                        pageNumber - 1 === index ? "block" : "hidden"
                      }`}
                      src={
                        loadedImages[index]
                          ? page.file
                          : "https://www.papermark.io/_static/blank.gif"
                      }
                      alt={`Page ${index + 1}`}
                      fetchPriority={loadedImages[index] ? "high" : "auto"}
                    />
                  );
                }

                return (
                  <Image
                    key={index}
                    className={`object-contain mx-auto ${
                      pageNumber - 1 === index ? "block" : "hidden"
                    }`}
                    src={loadedImages[index] ? page.file : BlankImg}
                    alt={`Page ${index + 1}`}
                    priority={loadedImages[index] ? true : false}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
                    quality={100}
                  />
                );
              })
            ) : (
              <LoadingSpinner className="h-20 w-20 text-foreground" />
            ))}
          {enableQuestion && feedback && pageNumber === numPagesWithFeedback ? (
            <div className="flex items-center justify-center w-full">
              <Question
                feedback={feedback}
                viewId={viewId}
                submittedFeedback={submittedFeedback}
                setSubmittedFeedback={setSubmittedFeedback}
              />
            </div>
          ) : null}
        </div>
        {feedbackEnabled && pageNumber !== numPagesWithFeedback ? (
          <Toolbar viewId={viewId} pageNumber={pageNumber} />
        ) : null}
        {screenshotProtectionEnabled ? <ScreenProtector /> : null}
        {showPoweredByBanner ? <PoweredBy linkId={linkId} /> : null}
      </div>
    </>
  );
}
