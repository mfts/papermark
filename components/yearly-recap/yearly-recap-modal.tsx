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
        <DialogContent className="max-w-[700px] overflow-hidden border-0 bg-white p-0 [&>button]:hidden">
          {/* Close button */}
          <button
            onClick={() => setShowShareView(false)}
            className="absolute right-4 top-4 z-50 text-foreground/60 transition-colors hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Shareable Card */}
          <div className="p-6">
            {(() => {
              const totalMinutes = Math.floor(stats.totalDuration / 60_000); // from milliseconds to minutes
              const distanceTraveled = stats.distanceTraveled || 0;

              return (
                <div
                  ref={shareCardRef}
                  className="w-full max-w-[500px] overflow-hidden rounded-2xl bg-gray-100 p-8"
                >
                  {/* Stats Grid */}
                  <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="mb-1 text-4xl font-bold text-black">
                          {totalMinutes.toLocaleString()}
                        </div>
                        <p className="text-xs text-gray-600">minutes viewed</p>
                      </div>
                      <div className="text-center">
                        <div className="mb-1 text-4xl font-bold text-black">
                          {distanceTraveled.toLocaleString()}
                        </div>
                        <p className="text-xs text-gray-600">km travelled</p>
                      </div>
                      <div className="text-center">
                        <div className="mb-1 text-4xl font-bold text-black">
                          {stats.totalDocuments}
                        </div>
                        <p className="text-xs text-gray-600">documents</p>
                      </div>
                      <div className="text-center">
                        <div className="mb-1 text-4xl font-bold text-black">
                          {stats.totalViews.toLocaleString()}
                        </div>
                        <p className="text-xs text-gray-600">views</p>
                      </div>
                    </div>
                    {/* <div className="text-center mt-4 pt-4 border-t border-gray-200">
                      <div className="text-4xl font-bold text-orange-500 mb-1">{countriesCount}</div>
                      <p className="text-xs text-gray-600">countries reached</p>
                    </div> */}
                  </div>

                  {/* Branding */}
                  <div className="mt-6 text-center">
                    <div className="inline-flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        Papermark
                      </span>
                      <span className="text-lg font-black text-gray-900">
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
          <p className="mb-4 px-6 text-center text-sm text-muted-foreground">
            Share your stats and receive{" "}
            <span className="font-semibold text-orange-600">$50</span> in
            credits on your papermark account, please send confirmation to{" "}
            <span className="font-medium">support@papermark.com</span> and
            include screenshot or link to your post.
          </p>

          {/* Share buttons */}
          <div className="flex items-center justify-between px-6 pb-6">
            <div className="flex items-center gap-2">
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
              className="gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-500 text-white hover:from-orange-600 hover:to-orange-600"
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
      <DialogContent className="min-w-[700px] max-w-[1100px] overflow-hidden border-0 p-0 [&>button]:hidden">
        <div
          className="relative min-h-[700px] overflow-hidden rounded-3xl shadow-2xl"
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
          <div className="relative z-10 flex gap-2 p-8">
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
            className="absolute right-8 top-8 z-50 text-foreground/60 transition-colors hover:text-foreground"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Slide content */}
          <div className="relative z-10 px-16 pb-16 pt-4">
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
            <div className="absolute bottom-8 left-0 right-0 z-10 flex items-center justify-center gap-3">
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
    <div className="relative flex min-h-[520px] flex-col items-center justify-center text-center">
      <h1 className="relative z-10 mb-4 text-balance text-6xl font-semibold text-foreground">
        Your {stats.year} with{" "}
        <span className="text-orange-500">Papermark</span>
      </h1>
      <p className="relative z-10 mb-14 max-w-xl text-sm text-gray-500">
        This review is personalised to your platform usage and contains your
        stats.
      </p>

      {/* Let's go button - only appears from bottom */}
      <Button
        onClick={onNext}
        size="lg"
        className="relative z-10 h-auto rounded-full bg-black px-10 py-3 text-lg text-white shadow-xl duration-700 animate-in slide-in-from-bottom-12 hover:from-orange-600 hover:to-orange-600"
      >
        Let&apos;s go
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}

function GlobalFootprintSlide({ stats }: { stats: YearlyRecapStats }) {
  const countriesCount = stats.uniqueCountries.length;
  const distanceTraveled = stats.distanceTraveled;

  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
      {/* Title section - appears from top */}
      <div className="duration-700 animate-in slide-in-from-top-8">
        {/* Big number */}
        <h2 className="mb-4 text-balance text-9xl font-bold text-foreground">
          {distanceTraveled.toLocaleString()}
          <span className="text-2xl font-normal text-foreground">km</span>
        </h2>

        <p className="mb-8 text-balance text-2xl font-normal text-foreground">
          your documents travelled this year
        </p>
      </div>

      {/* Countries box - appears from bottom */}
      <div className="duration-700 animate-in slide-in-from-bottom-8">
        <div className="w-56 rounded-2xl bg-card p-8 shadow-lg">
          <MapPin className="mx-auto mb-4 h-8 w-8 text-orange-600" />
          <div className="text-5xl font-bold text-foreground">
            {countriesCount}
          </div>
          <p className="mt-2 text-balance text-sm text-muted-foreground">
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
    <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
      {/* Header from top */}
      <div className="duration-700 animate-in slide-in-from-top-8">
        <p className="mb-2 text-lg text-muted-foreground">
          Total time on your documents
        </p>
        <h2 className="mb-2 text-8xl font-bold text-orange-500">
          {totalMinutes.toLocaleString()}
        </h2>
        <p className="text-2xl font-medium text-foreground">minutes</p>
      </div>

      {/* Document card from left */}
      {stats.mostViewedDocument && (
        <div className="mt-8 w-full max-w-xl rounded-xl border border-foreground/5 bg-white/80 p-5 shadow-sm backdrop-blur duration-700 animate-in slide-in-from-left-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
              <FileText className="h-6 w-6 text-orange-500" />
            </div>
            <div className="text-left">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Most Viewed
              </span>
              <h3 className="mt-1 font-semibold text-foreground">
                {stats.mostViewedDocument.documentName}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
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
    <div className="flex min-h-[520px] flex-col items-center justify-center">
      {/* Header from left */}
      <h2 className="mb-8 text-balance text-center text-3xl font-bold text-foreground duration-700 animate-in slide-in-from-left-8">
        Your {stats.year} activity on Papermark
      </h2>

      {/* Cards from right */}
      <div className="grid w-full max-w-5xl grid-cols-3 gap-5 duration-700 animate-in slide-in-from-right-8">
        <div className="rounded-2xl bg-card p-10 text-center shadow-lg">
          <Eye className="mx-auto mb-4 h-6 w-6 text-orange-500" />
          <span className="block text-5xl font-bold text-foreground">
            {stats.totalViews.toLocaleString()}
          </span>
          <p className="mt-3 text-balance text-sm font-medium text-muted-foreground">
            Views
          </p>
        </div>
        <div className="rounded-2xl bg-card p-10 text-center shadow-lg">
          <FileText className="mx-auto mb-4 h-6 w-6 text-orange-500" />
          <span className="block text-5xl font-bold text-foreground">
            {stats.totalDocuments.toLocaleString()}
          </span>
          <p className="mt-3 text-balance text-sm font-medium text-muted-foreground">
            Documents
          </p>
        </div>
        <div className="rounded-2xl bg-card p-10 text-center shadow-lg">
          <Database className="mx-auto mb-4 h-6 w-6 text-orange-600" />
          <span className="block text-5xl font-bold text-foreground">
            {stats.totalDatarooms.toLocaleString()}
          </span>
          <p className="mt-3 text-balance text-sm font-medium text-muted-foreground">
            Datarooms
          </p>
        </div>
      </div>
    </div>
  );
}

function MostActiveSlide({ stats }: { stats: YearlyRecapStats }) {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
      <h2 className="mb-2 text-balance text-3xl font-bold text-foreground">
        Your Most Active Viewer
      </h2>
      <p className="mb-10 text-balance text-lg text-muted-foreground">
        Someone really loves your documents!
      </p>

      {/* Card appears from bottom only */}
      {stats.mostActiveViewer ? (
        <div className="w-full max-w-xl rounded-3xl bg-card p-12 shadow-lg duration-700 animate-in slide-in-from-bottom-8">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/40">
            <Users className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-balance text-2xl font-bold text-foreground">
            {stats.mostActiveViewer.name || stats.mostActiveViewer.email}
          </h3>
          <p className="mt-3 text-balance text-muted-foreground">
            Viewed your documents{" "}
            <span className="font-semibold text-primary">
              {stats.mostActiveViewer.viewCount.toLocaleString()} times
            </span>
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-card p-12 shadow-lg">
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
    <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
      <h2 className="mb-4 text-balance text-4xl font-bold text-foreground">
        What a year! 🎉
      </h2>
      <p className="max-w-xl text-balance text-lg text-muted-foreground">
        You&apos;ve made an impact with your documents. Here&apos;s to an even
        bigger {stats.year + 1}!
      </p>

      {/* Busiest month */}
      {stats.mostActiveMonth && (
        <div className="mt-8 rounded-2xl bg-card px-8 py-5 shadow-lg duration-700 animate-in zoom-in-75">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-5 w-5 text-orange-600" />
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
    <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
      <h2 className="mb-6 text-balance text-3xl font-bold text-foreground">
        Share your stats or experience with Papermark
      </h2>

      <div className="duration-1000 animate-in zoom-in-50">
        <span className="mb-2 block text-8xl font-bold text-orange-500">
          $50
        </span>
      </div>

      <p className="mt-8 text-balance text-sm text-muted-foreground">
        You will receive $50 in credits on your papermark account, please send
        confirmation to{" "}
        <span className="font-medium">support@papermark.com</span> and include
        screenshot or link to your post.
      </p>
    </div>
  );
}
