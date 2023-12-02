import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useEffect, useRef, useState } from "react";
import { BlurImage } from "@/components/shared/blur-image";

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
  const [pageNumber, setPageNumber] = useState<number>(1); // start on first page

  const startTimeRef = useRef(Date.now());
  const pageNumberRef = useRef<number>(pageNumber);

  const numPages = pages.length;

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

  // Go to next page
  function goToNextPage() {
    if (pageNumber >= numPages) return;
    setPageNumber((prevPageNumber) => prevPageNumber + 1);
  }

  // Go to previous page
  function goToPreviousPage() {
    if (pageNumber <= 1) return;
    setPageNumber((prevPageNumber) => prevPageNumber - 1);
  }

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
          <BlurImage
            className="object-contain mx-auto"
            src={pages[pageNumber - 1].file}
            alt={`Page ${pageNumber}`}
            sizes="100vw"
            fill
            priority={true}
            quality={100}
          />
        </div>

        {/* Preload the next few images off-screen */}
        {/* <div className="absolute top-0 left-full">
          {pages.slice(pageNumber, pageNumber + 3).map((page, idx) => (
            <BlurImage
              key={idx}
              src={page.file}
              alt={`Preload Page ${page.pageNumber}`}
              quality={100}
              sizes="100vw"
              fill
              className="object-contain"
            />
          ))}
        </div> */}
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
