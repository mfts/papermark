import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import LoadingSpinner from "../ui/loading-spinner";
import BlankImg from "@/public/_static/blank.gif";
import Nav from "./nav";
import Toolbar from "./toolbar";
import { Brand } from "@prisma/client";

const DEFAULT_PRELOADED_IMAGES_NUM = 10;

export default function PagesViewer({
  pages,
  linkId,
  documentId,
  viewId,
  assistantEnabled,
  feedbackEnabled,
  versionNumber,
  brand,
}: {
  pages: { file: string; pageNumber: string }[];
  linkId: string;
  documentId: string;
  viewId: string;
  assistantEnabled: boolean;
  feedbackEnabled: boolean;
  versionNumber: number;
  brand?: Brand;
}) {
  const numPages = pages.length;
  const [pageNumber, setPageNumber] = useState<number>(1); // start on first page
  const [loadedImages, setLoadedImages] = useState<boolean[]>(
    new Array(numPages).fill(false),
  );

  const startTimeRef = useRef(Date.now());
  const pageNumberRef = useRef<number>(pageNumber);

  // Update the previous page number after the effect hook has run
  useEffect(() => {
    pageNumberRef.current = pageNumber;
  }, [pageNumber]);

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
    setPageNumber(pageNumber - 1);
  };

  // Navigate to next page and preload next image
  const goToNextPage = () => {
    if (pageNumber >= numPages) return;
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
        numPages={numPages}
        assistantEnabled={assistantEnabled}
        brand={brand}
      />
      <div
        style={{ height: "calc(100vh - 64px)" }}
        className="flex items-center relative"
      >
        <div className="flex items-center justify-between w-full absolute z-10 px-2">
          <button
            onClick={goToPreviousPage}
            disabled={pageNumber == 1}
            className="relative h-[calc(100vh - 64px)] px-2 py-24  focus:z-20 "
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
            disabled={pageNumber >= numPages}
            className="relative h-[calc(100vh - 64px)] px-2 py-24  focus:z-20"
          >
            <span className="sr-only">Next</span>
            <div className="bg-gray-950/50 hover:bg-gray-950/75 rounded-full relative flex items-center justify-center p-1">
              <ChevronRightIcon
                className="h-10 w-10 text-white"
                aria-hidden="true"
              />
            </div>
          </button>
        </div>

        <div className="flex justify-center mx-auto relative h-full w-full">
          {pages && loadedImages[pageNumber - 1] ? (
            pages.map((page, index) => (
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
            ))
          ) : (
            <LoadingSpinner className="h-20 w-20 text-foreground" />
          )}
        </div>
        {feedbackEnabled ? (
          <Toolbar viewId={viewId} pageNumber={pageNumber} />
        ) : null}
      </div>
    </>
  );
}
