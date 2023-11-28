import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Download } from "lucide-react";
import { useTeam } from "@/context/team-context";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function PDFViewer(props: any) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1); // start on first page
  const [loading, setLoading] = useState(true);
  const [pageWidth, setPageWidth] = useState(0);

  const startTimeRef = useRef(Date.now());
  const pageNumberRef = useRef<number>(pageNumber);
  const teamInfo = useTeam();

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

  useEffect(() => {
    if (numPages > 0) {
      updateNumPages(numPages);
    }
  }, [numPages]); // monitor numPages for changes

  function onDocumentLoadSuccess({
    numPages: nextNumPages,
  }: {
    numPages: number;
  }) {
    setNumPages(nextNumPages);
  }

  // Send the last page view when the user leaves the page
  // duration is measured in milliseconds
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

  function onPageLoadSuccess() {
    setPageWidth(window.innerWidth);
    setLoading(false);
  }

  const options = {
    cMapUrl: "cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "standard_fonts/",
  };

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
    if (pageNumber >= numPages!) return;
    setPageNumber((prevPageNumber) => prevPageNumber + 1);
  }

  function goToPreviousPage() {
    if (pageNumber <= 1) return;
    setPageNumber((prevPageNumber) => prevPageNumber - 1);
  }

  async function downloadfile(e: React.MouseEvent<HTMLButtonElement>) {
    try {
      //get file data
      const response = await fetch(props.file);
      const fileData = await response.blob();

      //create <a/> to download the file
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(fileData);
      a.download = props.name;
      document.body.appendChild(a);
      a.click();

      //clean up used resources
      document.body.removeChild(a);
      window.URL.revokeObjectURL(a.href);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  }

  async function trackPageView(duration: number = 0) {
    await fetch("/api/record_view", {
      method: "POST",
      body: JSON.stringify({
        linkId: props.linkId,
        documentId: props.documentId,
        viewId: props.viewId,
        duration: duration,
        pageNumber: pageNumberRef.current,
        versionNumber: props.versionNumber,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async function updateNumPages(numPages: number) {
    await fetch(`/api/teams/${teamInfo?.currentTeam?.id}/documents/update`, {
      method: "POST",
      body: JSON.stringify({
        documentId: props.documentId,
        numPages: numPages,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return (
    <>
      <Nav
        pageNumber={pageNumber}
        numPages={numPages}
        downloadFile={downloadfile}
        allowDownload={props.allowDownload}
      />
      <div
        hidden={loading}
        style={{ height: "calc(100vh - 64px)" }}
        className="flex items-center"
      >
        <div
          className={`flex items-center justify-between w-full absolute z-10 px-2`}
        >
          <button
            onClick={goToPreviousPage}
            disabled={pageNumber <= 1}
            className="relative h-[calc(100vh - 64px)] px-2 py-24 text-gray-400 hover:text-gray-50 focus:z-20"
          >
            <span className="sr-only">Previous</span>
            <ChevronLeftIcon className="h-10 w-10" aria-hidden="true" />
          </button>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages!}
            className="relative h-[calc(100vh - 64px)] px-2 py-24 text-gray-400 hover:text-gray-50 focus:z-20"
          >
            <span className="sr-only">Next</span>
            <ChevronRightIcon className="h-10 w-10" aria-hidden="true" />
          </button>
        </div>

        <div className="h-full flex justify-center mx-auto">
          <Document
            file={props.file}
            onLoadSuccess={onDocumentLoadSuccess}
            options={options}
            renderMode="canvas"
            className=""
          >
            <Page
              className=""
              key={pageNumber}
              pageNumber={pageNumber}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              onLoadSuccess={onPageLoadSuccess}
              onRenderError={() => setLoading(false)}
              width={Math.max(pageWidth * 0.8, 390)}
            />
          </Document>
        </div>
      </div>
    </>
  );
}

function Nav({
  pageNumber,
  numPages,
  allowDownload,
  downloadFile,
}: {
  pageNumber: number;
  numPages: number;
  allowDownload: boolean;
  downloadFile: (e: React.MouseEvent<HTMLButtonElement>) => void;
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
            <div className="bg-gray-900 text-white rounded-md px-3 py-2 text-sm font-medium m-1">
              <span>{pageNumber}</span>
              <span className="text-gray-400"> / {numPages}</span>
            </div>
            {allowDownload ? (
              <div className="bg-gray-900 text-white rounded-md px-2 py-1 text-sm  m-1">
                <button onClick={downloadFile}>
                  <Download className="w-8 h-6" />
                </button>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
