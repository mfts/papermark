import { useCallback, useEffect, useRef, useState } from "react";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { DocumentPreviewData } from "@/lib/types/document-preview";
import { paginateText, TEXT_PAGE_DEFAULTS } from "@/lib/utils/text-pagination";

import { Button } from "@/components/ui/button";

const CANVAS_WIDTH = 816;
const CANVAS_HEIGHT = 1056;
const CANVAS_PADDING = 48;
const FONT_SIZE = 14;
const LINE_HEIGHT = Math.floor(
  (CANVAS_HEIGHT - CANVAS_PADDING * 2) / TEXT_PAGE_DEFAULTS.linesPerPage,
);
const FONT_FAMILY = '"Courier New", Courier, monospace';

function renderPageToCanvas(
  canvas: HTMLCanvasElement,
  lines: string[],
  dpr: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  canvas.style.width = `${CANVAS_WIDTH}px`;
  canvas.style.height = `${CANVAS_HEIGHT}px`;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  ctx.fillStyle = "#1a1a1a";
  ctx.textBaseline = "top";

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], CANVAS_PADDING, CANVAS_PADDING + i * LINE_HEIGHT);
  }
}

interface PreviewTextViewerProps {
  documentData: DocumentPreviewData;
  onClose: () => void;
}

export function PreviewTextViewer({
  documentData,
  onClose,
}: PreviewTextViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState<string[][] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { file, documentName } = documentData;

  const numPages = pages?.length ?? 0;

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    async function fetchText() {
      try {
        setLoading(true);
        const response = await fetch(file!);
        if (!response.ok) throw new Error("Failed to load text file");
        const text = await response.text();
        if (cancelled) return;
        setPages(paginateText(text));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load file");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchText();
    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    if (!pages || !canvasRef.current) return;
    const currentPageLines = pages[currentPage - 1];
    if (!currentPageLines) return;
    const dpr = window.devicePixelRatio || 1;
    renderPageToCanvas(canvasRef.current, currentPageLines, dpr);
  }, [pages, currentPage]);

  const goToNextPage = useCallback(() => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, numPages]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          goToPreviousPage();
          break;
        case "ArrowRight":
          goToNextPage();
          break;
        case "Escape":
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [goToPreviousPage, goToNextPage, onClose]);

  if (!file) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-gray-400">Text file not available</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (error || !pages) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-gray-400">{error ?? "Failed to load file"}</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full select-none overflow-hidden">
      {/* Document Title & Page Counter */}
      <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2">
        <div className="rounded-lg bg-black/20 px-3 py-2 text-white">
          <span className="text-sm font-medium">
            {documentName} - Page {currentPage} of {numPages}
          </span>
        </div>
      </div>

      {/* Canvas Content */}
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="relative max-h-full max-w-full">
          <canvas
            ref={canvasRef}
            className="max-h-[calc(100vh-120px)] max-w-full rounded shadow-lg"
            style={{ objectFit: "contain" }}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </div>

      {/* Navigation */}
      {numPages > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 z-50 h-10 w-10 -translate-y-1/2 rounded-full bg-black/20 text-white hover:bg-black/40 hover:text-white disabled:opacity-30"
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 z-50 h-10 w-10 -translate-y-1/2 rounded-full bg-black/20 text-white hover:bg-black/40 hover:text-white disabled:opacity-30"
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
          >
            <ChevronRightIcon className="h-6 w-6" />
          </Button>
        </>
      )}
    </div>
  );
}
