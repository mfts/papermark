import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import LoadingSpinner from "../ui/loading-spinner";

const DEFAULT_PRELOADED_IMAGES_NUM = 10;

export default function PagesViewer({
  pages,
  linkId,
  documentId,
  viewId,
  versionNumber,
}: {
  pages: { file: string; pageNumber: string }[];
  linkId: string;
  documentId: string;
  viewId: string;
  versionNumber: number;
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowRight":
          goToNextPage();
          break;
        case "ArrowLeft":
          goToPreviousPage();
          break;
        default:
          break;
      }
    };

    // when the component mounts, attach the event listener
    document.addEventListener("keydown", handleKeyDown);

    // when the component unmounts, detach the event listener
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [pageNumber]);

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
    setPageNumber((prevPageNumber) => prevPageNumber - 1);
  };

  // Navigate to next page and preload next image
  const goToNextPage = () => {
    if (pageNumber >= numPages) return;
    preloadImage(DEFAULT_PRELOADED_IMAGES_NUM - 1 + pageNumber); // Preload the next image
    setPageNumber((prevPageNumber) => prevPageNumber + 1);
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

  return (
    <>
      <Nav pageNumber={pageNumber} numPages={numPages} />
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

        <div className="flex justify-center mx-auto">
          {pages && loadedImages[pageNumber - 1] ? (
            pages.map((page, index) => (
              <Image
                key={index}
                className={`object-contain mx-auto ${
                  pageNumber - 1 === index ? "block" : "hidden"
                }`}
                src={loadedImages[index] ? page.file : ""}
                alt={`Page ${index + 1}`}
                priority={loadedImages[index] ? true : false}
                fill
                sizes="100vw"
                quality={100}
              />
            ))
          ) : (
            <LoadingSpinner className="h-20 w-20 text-foreground" />
          )}
        </div>
      </div>
    </>
  );
}

function Nav({
  pageNumber,
  numPages,
}: {
  pageNumber: number;
  numPages: number;
}) {
  return (
    <nav className="bg-black">
      <div className="mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex flex-shrink-0 items-center">
              <p className="text-2xl font-bold tracking-tighter text-white">
                Papermark
              </p>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <div className="bg-gray-900 text-white rounded-md px-3 py-2 text-sm font-medium">
              <span>{pageNumber}</span>
              <span className="text-gray-400"> / {numPages}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
