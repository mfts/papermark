"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Database,
  Download,
  Eye,
  FileText,
  Files,
  Folder,
  Globe2,
  Grid3x3,
  MapPin,
  Paperclip,
  Share2,
  StickyNote,
  Users,
  X,
} from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import useSWRImmutable from "swr/immutable";

import { useAnalytics } from "@/lib/analytics";
import { cn, fetcher } from "@/lib/utils";

import LinkedInIcon from "@/components/shared/icons/linkedin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface YearlyRecapStats {
  year: number;
  totalViews: number;
  totalDocuments: number;
  totalLinks: number;
  totalDatarooms: number;
  mostViewedDocument: {
    documentId: string;
    documentName: string;
    viewCount: number;
  } | null;
  mostActiveMonth: {
    month: string;
    viewCount: number;
  } | null;
  mostActiveViewer: {
    email: string;
    name: string | null;
    viewCount: number;
  } | null;
  totalDuration: number;
  uniqueCountries: string[];
  distanceTraveled: number;
}

interface YearlyRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
}

// Decorative SVG Components
const DocumentStackSVG = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="10"
      y="10"
      width="60"
      height="80"
      rx="2"
      fill="#F5F5F5"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <rect
      x="15"
      y="20"
      width="60"
      height="80"
      rx="2"
      fill="#F5F5F5"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <rect
      x="20"
      y="30"
      width="60"
      height="80"
      rx="2"
      fill="#F5F5F5"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const FolderTabSVG = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 20 L10 70 L70 70 L70 30 L45 30 L35 20 Z"
      fill="#FFB84D"
      opacity="0.4"
      stroke="#FFB84D"
      strokeWidth="1.5"
    />
    <path d="M10 20 L35 20 L45 30 L10 30 Z" fill="#FFB84D" opacity="0.6" />
  </svg>
);

const StickyNoteSVG = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="10"
      y="10"
      width="60"
      height="60"
      rx="2"
      fill="#90EE90"
      opacity="0.4"
      stroke="#90EE90"
      strokeWidth="1.5"
    />
    <path d="M10 10 L70 10 L60 20 L10 20 Z" fill="#90EE90" opacity="0.6" />
  </svg>
);

const ScatterDotsSVG = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="25" cy="30" r="2" fill="#000000" opacity="0.5" />
    <circle cx="45" cy="25" r="1.5" fill="#000000" opacity="0.5" />
    <circle cx="65" cy="35" r="2" fill="#000000" opacity="0.5" />
    <circle cx="30" cy="55" r="1.5" fill="#000000" opacity="0.5" />
    <circle cx="55" cy="60" r="2" fill="#000000" opacity="0.5" />
    <circle cx="70" cy="70" r="1.5" fill="#000000" opacity="0.5" />
  </svg>
);

const CurvedLineSVG = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 200 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 25 Q50 10, 100 25 T200 25"
      stroke="#D3D3D3"
      strokeWidth="2"
      fill="none"
      opacity="0.5"
    />
  </svg>
);

const RECAP_GRADIENT = "";

const slides = [
  { id: "intro", gradient: RECAP_GRADIENT },
  { id: "globalFootprint", gradient: RECAP_GRADIENT },
  { id: "minutes", gradient: RECAP_GRADIENT },
  { id: "viewsStats", gradient: RECAP_GRADIENT },
  { id: "mostActive", gradient: RECAP_GRADIENT },
  { id: "summary", gradient: RECAP_GRADIENT },
  { id: "shareOffer", gradient: RECAP_GRADIENT },
];

export function YearlyRecapModal({
  isOpen,
  onClose,
  teamId,
}: YearlyRecapModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showShareView, setShowShareView] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const analytics = useAnalytics();

  const { data: stats, isLoading } = useSWRImmutable<YearlyRecapStats>(
    teamId && isOpen ? `/api/teams/${teamId}/yearly-recap` : null,
    fetcher,
  );

  const handleClose = () => {
    setCurrentSlide(0);
    setShowShareView(false);
    onClose();
  };

  // Keyboard shortcuts
  useHotkeys(
    "right",
    () => {
      if (!showShareView && currentSlide < slides.length - 1) {
        setCurrentSlide((prev) => prev + 1);
      }
    },
    { enabled: isOpen },
    [showShareView, currentSlide],
  );

  useHotkeys(
    "left",
    () => {
      if (!showShareView && currentSlide > 0) {
        setCurrentSlide((prev) => prev - 1);
      }
    },
    { enabled: isOpen },
    [showShareView, currentSlide],
  );

  useHotkeys(
    "enter, space",
    (e) => {
      if (!showShareView && currentSlide < slides.length - 1) {
        e.preventDefault();
        setCurrentSlide((prev) => prev + 1);
      }
    },
    { enabled: isOpen },
    [showShareView, currentSlide],
  );

  useHotkeys(
    "escape",
    () => {
      if (showShareView) {
        setShowShareView(false);
      } else {
        handleClose();
      }
    },
    { enabled: isOpen },
    [showShareView],
  );

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleShare = () => {
    analytics.capture("YIR: Share Clicked", { teamId });
    setShowShareView(true);
  };

  const captureImage = useCallback(async (): Promise<Blob | null> => {
    if (!shareCardRef.current) return null;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, "image/png");
      });
    } catch (error) {
      console.error("Error capturing image:", error);
      toast.error("Failed to capture image");
      return null;
    }
  }, []);

  const handleDownload = async () => {
    analytics.capture("YIR: Share Platform Clicked", {
      teamId,
      platform: "download",
    });
    setIsCapturing(true);
    try {
      const blob = await captureImage();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `papermark-wrapped-${stats?.year || 2025}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Image downloaded!");
      }
    } catch (error) {
      toast.error("Failed to download image");
    } finally {
      setIsCapturing(false);
    }
  };

  const getShareText = () => {
    const totalMinutes = Math.floor((stats?.totalDuration || 0) / 60_000); // from milliseconds to minutes
    const countriesCount = stats?.uniqueCountries?.length || 0;
    const distanceTraveled = stats?.distanceTraveled || 0;

    return `· ${totalMinutes.toLocaleString()} min my docs were viewed
· ${distanceTraveled.toLocaleString()} km travelled my documents
· ${stats?.totalDocuments} documents
· ${stats?.totalViews?.toLocaleString()} views
· ${countriesCount} countries

My Papermark Wrapped ${stats?.year}!

#PapermarkWrapped https://www.papermark.com/`;
  };

  const handleShareLinkedIn = async () => {
    analytics.capture("YIR: Share Platform Clicked", {
      teamId,
      platform: "linkedin",
    });
    const text = getShareText();
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://www.papermark.com/")}&summary=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  const handleShareTwitter = async () => {
    analytics.capture("YIR: Share Platform Clicked", {
      teamId,
      platform: "twitter",
    });
    const text = getShareText();
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  if (isLoading || !stats) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-4xl overflow-hidden border-0 p-0"
          style={{
            background:
              "linear-gradient(to right, rgba(249, 115, 22, 0.2) 0%, rgba(249, 115, 22, 0.1) 25%, #EEEFEB 50%, rgba(16, 185, 129, 0.1) 75%, rgba(16, 185, 129, 0.2) 100%)",
          }}
        >
          <div className="flex items-center justify-center p-8">
            <div className="text-balance text-center">
              Loading your recap...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Share View
  if (showShareView) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="w-full max-w-[700px] overflow-hidden border-0 bg-white p-0 [&>button]:hidden">
          {/* Close button */}
          <button
            onClick={() => setShowShareView(false)}
            className="absolute right-4 top-4 z-50 text-foreground/60 transition-colors hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Shareable Card */}
          <div className="p-4 sm:p-6">
            {(() => {
              const totalMinutes = Math.floor(stats.totalDuration / 60_000); // from milliseconds to minutes
              const distanceTraveled = stats.distanceTraveled || 0;

              return (
                <div
                  ref={shareCardRef}
                  className="mx-auto w-full max-w-[500px] overflow-hidden rounded-2xl bg-gray-100 p-4 sm:p-8"
                >
                  {/* Stats Grid */}
                  <div className="mb-4 rounded-xl bg-white p-4 shadow-sm sm:mb-6 sm:p-6">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center">
                        <div className="mb-1 text-2xl font-bold text-black sm:text-4xl">
                          {totalMinutes.toLocaleString()}
                        </div>
                        <p className="text-[10px] text-gray-600 sm:text-xs">
                          minutes viewed
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="mb-1 text-2xl font-bold text-black sm:text-4xl">
                          {distanceTraveled.toLocaleString()}
                        </div>
                        <p className="text-[10px] text-gray-600 sm:text-xs">
                          km travelled
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="mb-1 text-2xl font-bold text-black sm:text-4xl">
                          {stats.totalDocuments}
                        </div>
                        <p className="text-[10px] text-gray-600 sm:text-xs">
                          documents
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="mb-1 text-2xl font-bold text-black sm:text-4xl">
                          {stats.totalViews.toLocaleString()}
                        </div>
                        <p className="text-[10px] text-gray-600 sm:text-xs">
                          views
                        </p>
                      </div>
                    </div>
                    {/* <div className="text-center mt-4 pt-4 border-t border-gray-200">
                      <div className="text-4xl font-bold text-orange-500 mb-1">{countriesCount}</div>
                      <p className="text-xs text-gray-600">countries reached</p>
                    </div> */}
                  </div>

                  {/* Branding */}
                  <div className="mt-4 text-center sm:mt-6">
                    <div className="inline-flex items-center gap-2">
                      <span className="text-base font-bold text-gray-900 sm:text-lg">
                        Papermark
                      </span>
                      <span className="text-base font-black text-gray-900 sm:text-lg">
                        WRAPPED
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">papermark.com</p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* $50 grant text */}
          <p className="mb-4 px-4 text-center text-xs text-muted-foreground sm:px-6 sm:text-sm">
            Share your stats and receive{" "}
            <span className="font-semibold text-orange-600">$50</span> in
            credits on your papermark account, please send confirmation to{" "}
            <span className="font-medium">support@papermark.com</span> and
            include screenshot or link to your post.
          </p>

          {/* Share buttons */}
          <div className="flex flex-col-reverse items-center gap-3 px-4 pb-4 sm:flex-row sm:justify-between sm:px-6 sm:pb-6">
            <div className="flex items-center justify-center gap-2">
              <Button
                onClick={handleShareLinkedIn}
                variant="secondary"
                size="icon"
                className="rounded-full"
              >
                <LinkedInIcon className="h-4 w-4" color={false} />
              </Button>
              <Button
                onClick={handleShareTwitter}
                variant="secondary"
                size="icon"
                className="rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 1200 1227"
                  className="h-4 w-4"
                  fill="currentColor"
                >
                  <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
                </svg>
              </Button>
              <Button
                onClick={handleDownload}
                disabled={isCapturing}
                variant="secondary"
                size="icon"
                className="rounded-full"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={() => setShowShareView(false)}
              className="w-full gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-500 text-white hover:from-orange-600 hover:to-orange-600 sm:w-auto"
            >
              Back to Wrapped
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[1100px] overflow-hidden border-0 p-0 sm:min-w-[700px] [&>button]:hidden">
        <div
          className="relative min-h-[500px] overflow-hidden rounded-3xl shadow-2xl sm:min-h-[700px]"
          style={{
            background:
              "linear-gradient(to right, rgba(249, 115, 22, 0.2) 0%, rgba(249, 115, 22, 0.1) 25%, #EEEFEB 50%, rgba(16, 185, 129, 0.1) 75%, rgba(16, 185, 129, 0.2) 100%)",
          }}
        >
          {/* Decorative background elements - same as banner */}
          {/* <DocumentStackSVG className="absolute top-16 -right-2 w-24 h-28 text-foreground opacity-50" /> */}
          {/* <ScatterDotsSVG className="absolute top-1/4 left-1/4 w-20 h-20" /> */}
          {/* <Paperclip className="absolute bottom-16 left-8 w-16 h-16 text-foreground/30" strokeWidth="1" /> */}

          {/* Progress bar */}
          <div className="relative z-10 flex gap-1.5 p-4 sm:gap-2 sm:p-8">
            {slides.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-300",
                  index <= currentSlide
                    ? "bg-foreground/40"
                    : "bg-foreground/10",
                )}
              />
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-50 text-foreground/60 transition-colors hover:text-foreground sm:right-8 sm:top-8"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Slide content */}
          <div className="relative z-10 px-4 pb-20 pt-2 sm:px-16 sm:pb-16 sm:pt-4">
            {currentSlide === 0 && (
              <IntroSlide stats={stats} onNext={nextSlide} />
            )}
            {currentSlide === 1 && <GlobalFootprintSlide stats={stats} />}
            {currentSlide === 2 && <MinutesSlide stats={stats} />}
            {currentSlide === 3 && <ViewsStatsSlide stats={stats} />}
            {currentSlide === 4 && <MostActiveSlide stats={stats} />}
            {currentSlide === 5 && <SummarySlide stats={stats} />}
            {currentSlide === 6 && <ShareOfferSlide stats={stats} />}
          </div>

          {/* Navigation - hidden on first slide */}
          {currentSlide > 0 && (
            <div className="absolute bottom-4 left-0 right-0 z-10 flex items-center justify-center gap-2 sm:bottom-8 sm:gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="h-10 w-10 rounded-full bg-foreground/10 hover:bg-foreground/20 disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                onClick={handleShare}
                className="gap-2 rounded-full bg-foreground px-6 text-gray-100 hover:bg-foreground/90"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextSlide}
                disabled={currentSlide === slides.length - 1}
                className="h-10 w-10 rounded-full bg-foreground/10 hover:bg-foreground/20 disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function IntroSlide({
  stats,
  onNext,
}: {
  stats: YearlyRecapStats;
  onNext: () => void;
}) {
  return (
    <div className="relative flex min-h-[350px] flex-col items-center justify-center text-center sm:min-h-[520px]">
      <h1 className="relative z-10 mb-4 text-balance text-3xl font-semibold text-foreground sm:text-6xl">
        Your {stats.year} with{" "}
        <span className="text-orange-500">Papermark</span>
      </h1>
      <p className="relative z-10 mb-10 max-w-xl px-2 text-xs text-gray-500 sm:mb-14 sm:px-0 sm:text-sm">
        This review is personalised to your platform usage and contains your
        stats.
      </p>

      {/* Let's go button - only appears from bottom */}
      <Button
        onClick={onNext}
        size="lg"
        className="relative z-10 h-auto rounded-full bg-black px-8 py-2.5 text-base text-white shadow-xl duration-700 animate-in slide-in-from-bottom-12 hover:from-orange-600 hover:to-orange-600 sm:px-10 sm:py-3 sm:text-lg"
      >
        Let&apos;s go
        <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
      </Button>
    </div>
  );
}

function GlobalFootprintSlide({ stats }: { stats: YearlyRecapStats }) {
  const countriesCount = stats.uniqueCountries.length;
  const distanceTraveled = stats.distanceTraveled;

  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center text-center sm:min-h-[520px]">
      {/* Title section - appears from top */}
      <div className="duration-700 animate-in slide-in-from-top-8">
        {/* Big number */}
        <h2 className="mb-2 text-balance text-5xl font-bold text-foreground sm:mb-4 sm:text-9xl">
          {distanceTraveled.toLocaleString()}
          <span className="text-lg font-normal text-foreground sm:text-2xl">
            km
          </span>
        </h2>

        <p className="mb-6 text-balance text-lg font-normal text-foreground sm:mb-8 sm:text-2xl">
          your documents travelled this year
        </p>
      </div>

      {/* Countries box - appears from bottom */}
      <div className="duration-700 animate-in slide-in-from-bottom-8">
        <div className="w-40 rounded-xl bg-card p-5 shadow-lg sm:w-56 sm:rounded-2xl sm:p-8">
          <MapPin className="mx-auto mb-2 h-6 w-6 text-orange-600 sm:mb-4 sm:h-8 sm:w-8" />
          <div className="text-3xl font-bold text-foreground sm:text-5xl">
            {countriesCount}
          </div>
          <p className="mt-1 text-balance text-xs text-muted-foreground sm:mt-2 sm:text-sm">
            Countries
          </p>
        </div>
      </div>
    </div>
  );
}

function MinutesSlide({ stats }: { stats: YearlyRecapStats }) {
  const totalMinutes = Math.floor(stats.totalDuration / 60_000); // from milliseconds to minutes

  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center text-center sm:min-h-[520px]">
      {/* Header from top */}
      <div className="duration-700 animate-in slide-in-from-top-8">
        <p className="mb-2 text-sm text-muted-foreground sm:text-lg">
          Total time on your documents
        </p>
        <h2 className="mb-2 text-5xl font-bold text-orange-500 sm:text-8xl">
          {totalMinutes.toLocaleString()}
        </h2>
        <p className="text-lg font-medium text-foreground sm:text-2xl">
          minutes
        </p>
      </div>

      {/* Document card from left */}
      {stats.mostViewedDocument && (
        <div className="mt-6 w-full max-w-xl rounded-xl border border-foreground/5 bg-white/80 p-4 shadow-sm backdrop-blur duration-700 animate-in slide-in-from-left-8 sm:mt-8 sm:p-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500/10 sm:h-12 sm:w-12">
              <FileText className="h-5 w-5 text-orange-500 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 text-left">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Most Viewed
              </span>
              <h3 className="mt-1 truncate text-sm font-semibold text-foreground sm:text-base">
                {stats.mostViewedDocument.documentName}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                <span className="font-semibold text-orange-500">
                  {stats.mostViewedDocument.viewCount.toLocaleString()}
                </span>{" "}
                views
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ViewsStatsSlide({ stats }: { stats: YearlyRecapStats }) {
  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center sm:min-h-[520px]">
      {/* Header from left */}
      <h2 className="mb-6 text-balance text-center text-xl font-bold text-foreground duration-700 animate-in slide-in-from-left-8 sm:mb-8 sm:text-3xl">
        Your {stats.year} activity on Papermark
      </h2>

      {/* Cards from right */}
      <div className="grid w-full max-w-5xl grid-cols-3 gap-2 duration-700 animate-in slide-in-from-right-8 sm:gap-5">
        <div className="rounded-xl bg-card p-4 text-center shadow-lg sm:rounded-2xl sm:p-10">
          <Eye className="mx-auto mb-2 h-5 w-5 text-orange-500 sm:mb-4 sm:h-6 sm:w-6" />
          <span className="block text-2xl font-bold text-foreground sm:text-5xl">
            {stats.totalViews.toLocaleString()}
          </span>
          <p className="mt-1 text-balance text-xs font-medium text-muted-foreground sm:mt-3 sm:text-sm">
            Views
          </p>
        </div>
        <div className="rounded-xl bg-card p-4 text-center shadow-lg sm:rounded-2xl sm:p-10">
          <FileText className="mx-auto mb-2 h-5 w-5 text-orange-500 sm:mb-4 sm:h-6 sm:w-6" />
          <span className="block text-2xl font-bold text-foreground sm:text-5xl">
            {stats.totalDocuments.toLocaleString()}
          </span>
          <p className="mt-1 text-balance text-xs font-medium text-muted-foreground sm:mt-3 sm:text-sm">
            Documents
          </p>
        </div>
        <div className="rounded-xl bg-card p-4 text-center shadow-lg sm:rounded-2xl sm:p-10">
          <Database className="mx-auto mb-2 h-5 w-5 text-orange-600 sm:mb-4 sm:h-6 sm:w-6" />
          <span className="block text-2xl font-bold text-foreground sm:text-5xl">
            {stats.totalDatarooms.toLocaleString()}
          </span>
          <p className="mt-1 text-balance text-xs font-medium text-muted-foreground sm:mt-3 sm:text-sm">
            Datarooms
          </p>
        </div>
      </div>
    </div>
  );
}

function MostActiveSlide({ stats }: { stats: YearlyRecapStats }) {
  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center text-center sm:min-h-[520px]">
      <h2 className="mb-2 text-balance text-xl font-bold text-foreground sm:text-3xl">
        Your Most Active Viewer
      </h2>
      <p className="mb-6 text-balance text-sm text-muted-foreground sm:mb-10 sm:text-lg">
        Someone really loves your documents!
      </p>

      {/* Card appears from bottom only */}
      {stats.mostActiveViewer ? (
        <div className="w-full max-w-xl rounded-2xl bg-card p-6 shadow-lg duration-700 animate-in slide-in-from-bottom-8 sm:rounded-3xl sm:p-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/40 sm:mb-6 sm:h-24 sm:w-24">
            <Users className="h-8 w-8 text-primary sm:h-12 sm:w-12" />
          </div>
          <h3 className="truncate text-balance text-lg font-bold text-foreground sm:text-2xl">
            {stats.mostActiveViewer.name || stats.mostActiveViewer.email}
          </h3>
          <p className="mt-2 text-balance text-sm text-muted-foreground sm:mt-3 sm:text-base">
            Viewed your documents{" "}
            <span className="font-semibold text-primary">
              {stats.mostActiveViewer.viewCount.toLocaleString()} times
            </span>
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-card p-6 shadow-lg sm:rounded-3xl sm:p-12">
          <p className="text-balance text-muted-foreground">
            No viewer data available
          </p>
        </div>
      )}
    </div>
  );
}

function SummarySlide({ stats }: { stats: YearlyRecapStats }) {
  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center text-center sm:min-h-[520px]">
      <h2 className="mb-3 text-balance text-2xl font-bold text-foreground sm:mb-4 sm:text-4xl">
        What a year! 🎉
      </h2>
      <p className="max-w-xl text-balance px-2 text-sm text-muted-foreground sm:px-0 sm:text-lg">
        You&apos;ve made an impact with your documents. Here&apos;s to an even
        bigger {stats.year + 1}!
      </p>

      {/* Busiest month */}
      {stats.mostActiveMonth && (
        <div className="mt-6 rounded-xl bg-card px-5 py-4 shadow-lg duration-700 animate-in zoom-in-75 sm:mt-8 sm:rounded-2xl sm:px-8 sm:py-5">
          <div className="flex items-center gap-2 text-xs sm:gap-3 sm:text-sm">
            <Calendar className="h-4 w-4 text-orange-600 sm:h-5 sm:w-5" />
            <span className="text-muted-foreground">Busiest month:</span>
            <span className="font-semibold text-foreground">
              {stats.mostActiveMonth.month}
            </span>
          </div>
        </div>
      )}

      {/* Numbers only */}
      {/* <div className="flex items-center justify-center gap-8 mt-10">
        <span className="text-5xl font-bold text-foreground animate-in zoom-in-75 duration-700" style={{ animationDelay: "0ms" }}>
          {stats.totalViews.toLocaleString()}
        </span>
        <span className="text-5xl font-bold text-foreground animate-in zoom-in-75 duration-700" style={{ animationDelay: "150ms" }}>
          {stats.totalDocuments.toLocaleString()}
        </span>
        <span className="text-5xl font-bold text-foreground animate-in zoom-in-75 duration-700" style={{ animationDelay: "300ms" }}>
          {stats.totalDatarooms.toLocaleString()}
        </span>
      </div> */}
    </div>
  );
}

function ShareOfferSlide({ stats }: { stats: YearlyRecapStats }) {
  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center text-center sm:min-h-[520px]">
      <h2 className="mb-4 text-balance text-xl font-bold text-foreground sm:mb-6 sm:text-3xl">
        Share your stats or experience with Papermark
      </h2>

      <div className="duration-1000 animate-in zoom-in-50">
        <span className="mb-2 block text-6xl font-bold text-orange-500 sm:text-8xl">
          $50
        </span>
      </div>

      <p className="mt-6 max-w-sm text-balance px-2 text-xs text-muted-foreground sm:mt-8 sm:max-w-none sm:px-0 sm:text-sm">
        You will receive $50 in credits on your papermark account, please send
        confirmation to{" "}
        <span className="font-medium">support@papermark.com</span> and include
        screenshot or link to your post.
      </p>
    </div>
  );
}
