import { useEffect, useRef, useState } from "react";

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const trackPageView = async (data: {
  linkId: string;
  documentId: string;
  viewId: string;
  duration: number;
  pageNumber: number;
  versionNumber: number;
  dataroomId?: string;
}) => {
  console.log("record view data: ", data);
  // await fetch("/api/record_view", {
  //   method: "POST",
  //   body: JSON.stringify(data),
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  // });
};

export default function PagesViewer({
  pages,
  linkId,
  documentId,
  viewId,
  versionNumber,
  dataroomId,
  isVertical = true,
}: {
  pages: { file: string; pageNumber: string; embeddedLinks: string[] }[];
  linkId: string;
  documentId: string;
  viewId: string;
  versionNumber: number;
  dataroomId?: string;
  isVertical?: boolean;
}) {
  const numPages = pages.length;
  const [pageNumber, setPageNumber] = useState<number>(1);
  const startTimeRef = useRef(Date.now());
  const pageNumberRef = useRef<number>(pageNumber);
  const visibilityRef = useRef<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollActionRef = useRef<boolean>(false);
  const hasTrackedDownRef = useRef<boolean>(false);
  const hasTrackedUpRef = useRef<boolean>(false);

  // Update the previous page number after the effect hook has run
  useEffect(() => {
    pageNumberRef.current = pageNumber;
    hasTrackedDownRef.current = false; // Reset tracking status on page number change
    hasTrackedUpRef.current = false; // Reset tracking status on page number change
  }, [pageNumber]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log(">>> calling visibility change");
      if (document.visibilityState === "visible") {
        visibilityRef.current = true;
        startTimeRef.current = Date.now(); // Reset start time when the page becomes visible again
      } else {
        visibilityRef.current = false;
        if (pageNumber <= numPages) {
          console.log(
            ">>> tracking page view BECAUSE VISIBILITY FALSE",
            pageNumber,
            pageNumberRef.current,
          );
          const duration = Date.now() - startTimeRef.current;
          trackPageView({
            linkId,
            documentId,
            viewId,
            duration,
            pageNumber: pageNumberRef.current,
            versionNumber,
            dataroomId,
          });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pageNumber, numPages]);

  useEffect(() => {
    // console.log(">>> calling pagenumer change");
    startTimeRef.current = Date.now();

    return () => {
      if (visibilityRef.current && pageNumber <= numPages) {
        console.log(
          ">>> tracking page view BECAUSE VISIBILITY CURRENT TRUE",
          pageNumber,
          pageNumberRef.current,
        );
        const duration = Date.now() - startTimeRef.current;
        trackPageView({
          linkId,
          documentId,
          viewId,
          duration,
          pageNumber: pageNumberRef.current,
          versionNumber,
          dataroomId,
        });
      }
    };
  }, [pageNumber, numPages]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log(">>> calling before unload");
      if (pageNumber <= numPages && visibilityRef.current) {
        console.log(
          ">>> tracking page view BECAUSE VISIBILITY CURRENT TRUE in before unload",
          pageNumber,
          pageNumberRef.current,
        );
        const duration = Date.now() - startTimeRef.current;
        trackPageView({
          linkId,
          documentId,
          viewId,
          duration,
          pageNumber: pageNumberRef.current,
          versionNumber,
          dataroomId,
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pageNumber, numPages]);

  const handleScroll = () => {
    if (!isVertical) return;

    const container = containerRef.current;
    if (!container) return;

    const scrollPosition = container.scrollTop;
    const pageHeight = container.scrollHeight / numPages;

    const currentPage = Math.floor(scrollPosition / pageHeight) + 1;
    const currentPageFraction = (scrollPosition % pageHeight) / pageHeight;

    if (scrollActionRef.current) {
      if (scrollPosition % pageHeight === 0) {
        scrollActionRef.current = false;
      }
      return;
    }

    console.log(">>> current page: ", currentPage);
    // Log at 0.1 increments
    const increment = 0.1;
    const marginOfError = 0.005; // Small margin of error
    if (Math.abs(currentPageFraction % increment) < marginOfError) {
      console.log(
        ">>> current page fraction: ",
        currentPageFraction.toFixed(1),
      );
    }

    // Scroll Down Tracking
    if (
      currentPageFraction >= 0.8 &&
      currentPage === pageNumberRef.current &&
      !hasTrackedDownRef.current
    ) {
      console.log("scrolling down", currentPage, pageNumberRef.current);
      const duration = Date.now() - startTimeRef.current;
      trackPageView({
        linkId,
        documentId,
        viewId,
        duration,
        pageNumber: pageNumberRef.current,
        versionNumber,
        dataroomId,
      });
      setPageNumber(currentPage);
      pageNumberRef.current = currentPage;
      startTimeRef.current = Date.now();
      hasTrackedDownRef.current = true;
      hasTrackedUpRef.current = false;
    } else if (
      currentPageFraction >= 0.8 &&
      currentPage === pageNumberRef.current - 1 &&
      !hasTrackedDownRef.current
    ) {
      console.log("scrolling down 2", currentPage, pageNumberRef.current);
      const duration = Date.now() - startTimeRef.current;
      trackPageView({
        linkId,
        documentId,
        viewId,
        duration,
        pageNumber: pageNumberRef.current,
        versionNumber,
        dataroomId,
      });
      setPageNumber(currentPage);
      pageNumberRef.current = currentPage;
      startTimeRef.current = Date.now();
      hasTrackedDownRef.current = true;
      hasTrackedUpRef.current = false;
    }

    // Scroll Up Tracking
    if (
      currentPageFraction <= 0.2 &&
      currentPage === pageNumberRef.current &&
      !hasTrackedUpRef.current
    ) {
      console.log("scrolling up", currentPage, pageNumberRef.current);
      const duration = Date.now() - startTimeRef.current;
      trackPageView({
        linkId,
        documentId,
        viewId,
        duration,
        pageNumber: pageNumberRef.current,
        versionNumber,
        dataroomId,
      });
      setPageNumber(currentPage);
      pageNumberRef.current = currentPage;
      startTimeRef.current = Date.now();
      hasTrackedUpRef.current = true;
      hasTrackedDownRef.current = false;
    } else if (
      currentPageFraction <= 0.2 &&
      currentPage === pageNumberRef.current + 1 &&
      !hasTrackedUpRef.current
    ) {
      console.log("scrolling up 2", currentPage, pageNumberRef.current);
      const duration = Date.now() - startTimeRef.current;
      trackPageView({
        linkId,
        documentId,
        viewId,
        duration,
        pageNumber: pageNumberRef.current + 1,
        versionNumber,
        dataroomId,
      });
      setPageNumber(currentPage);
      pageNumberRef.current = currentPage;
      startTimeRef.current = Date.now();
      hasTrackedUpRef.current = true;
      hasTrackedDownRef.current = false;
    }

    // Reset tracking flags when crossing 50%
    // if (currentPageFraction < 0.5 && hasTrackedDownRef.current) {
    //   hasTrackedDownRef.current = false;
    // } else if (currentPageFraction > 0.5 && hasTrackedUpRef.current) {
    //   hasTrackedUpRef.current = false;
    // }
  };

  const goToPreviousPage = () => {
    if (pageNumber > 1) {
      console.log(
        ">>> tracking page view by PREVIOUS PAGE",
        pageNumber,
        pageNumberRef.current,
      );
      const duration = Date.now() - startTimeRef.current;
      trackPageView({
        linkId,
        documentId,
        viewId,
        duration,
        pageNumber: pageNumberRef.current,
        versionNumber,
        dataroomId,
      });
      setPageNumber(pageNumber - 1);
      pageNumberRef.current = pageNumber - 1;
      startTimeRef.current = Date.now();
      if (isVertical) {
        scrollActionRef.current = true;
        containerRef.current?.scrollTo({
          top:
            containerRef.current.scrollHeight * ((pageNumber - 2) / numPages),
          behavior: "smooth",
        });
      }
    }
  };

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      console.log(
        ">>> tracking page view by NEXT PAGE",
        pageNumber,
        pageNumberRef.current,
      );
      const duration = Date.now() - startTimeRef.current;
      trackPageView({
        linkId,
        documentId,
        viewId,
        duration,
        pageNumber: pageNumberRef.current,
        versionNumber,
        dataroomId,
      });
      setPageNumber(pageNumber + 1);
      pageNumberRef.current = pageNumber + 1;
      startTimeRef.current = Date.now();
      if (isVertical) {
        scrollActionRef.current = true;
        containerRef.current?.scrollTo({
          top: containerRef.current.scrollHeight * (pageNumber / numPages),
          behavior: "smooth",
        });
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (isVertical) {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault(); // Prevent default behavior
          event.stopPropagation(); // Stop propagation
          goToNextPage();
          break;
        case "ArrowUp":
          event.preventDefault(); // Prevent default behavior
          event.stopPropagation(); // Stop propagation
          goToPreviousPage();
          break;
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
    } else {
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
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, goToNextPage, goToPreviousPage]);

  useEffect(() => {
    if (!isVertical) return;

    // console.log(">>> calling scroll effect", containerRef.current);
    if (isVertical && containerRef.current) {
      containerRef.current.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isVertical, handleScroll]);

  // useEffect(() => {
  //   console.log("current page number: ", pageNumber);
  //   console.log("current page number ref: ", pageNumberRef.current);
  // }, [pageNumber, pageNumberRef.current]);

  return (
    <div className={cn("relative flex items-center", isVertical && "h-screen")}>
      <div
        className={`relative flex h-full w-full ${
          isVertical ? "flex-col overflow-y-auto" : "flex-row"
        }`}
        ref={containerRef}
      >
        <div className={`flex ${isVertical ? "flex-col" : "flex-row"} w-full`}>
          {pages.map((page, index) => (
            <div
              key={index}
              className={cn(
                "relative h-screen w-full",
                pageNumber - 1 === index
                  ? "block"
                  : !isVertical
                    ? "hidden"
                    : "block",
              )}
            >
              <span className="absolute right-10 top-10 bg-black text-white">
                PAGE NUMBER {index + 1}
              </span>
              <img
                className={cn("h-full w-full object-contain")}
                src={page.file}
                alt={`Page ${index + 1}`}
              />
            </div>
          ))}
        </div>
      </div>
      {isVertical && (
        <>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform">
            <button onClick={goToNextPage} disabled={pageNumber === numPages}>
              <ChevronDownIcon className="h-10 w-10 text-white" />
            </button>
          </div>
          <div className="absolute left-1/2 top-4 -translate-x-1/2 transform">
            <button onClick={goToPreviousPage} disabled={pageNumber === 1}>
              <ChevronUpIcon className="h-10 w-10 text-white" />
            </button>
          </div>
        </>
      )}
      {!isVertical && (
        <>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 transform">
            <button onClick={goToPreviousPage} disabled={pageNumber === 1}>
              <ChevronLeftIcon className="h-10 w-10 text-white" />
            </button>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 transform">
            <button onClick={goToNextPage} disabled={pageNumber === numPages}>
              <ChevronRightIcon className="h-10 w-10 text-white" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
