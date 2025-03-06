import { useEffect, useRef, useState } from "react";

import { Brand, DataroomBrand } from "@prisma/client";
import { toast } from "sonner";

import { createVideoTracker } from "@/lib/tracking/video-tracking";
import { cn } from "@/lib/utils";

import { ScreenProtector } from "../ScreenProtection";
import { TDocumentData } from "../dataroom/dataroom-view";
import Nav from "../nav";
import { VideoPlayer } from "./video-player";

export default function VideoViewer({
  file,
  linkId,
  documentId,
  viewId,
  documentName,
  allowDownload,
  screenshotProtectionEnabled,
  versionNumber,
  brand,
  dataroomId,
  setDocumentData,
  isPreview,
}: {
  file: string;
  linkId: string;
  documentId: string;
  viewId?: string;
  documentName: string;
  allowDownload: boolean;
  screenshotProtectionEnabled: boolean;
  versionNumber: number;
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
  dataroomId?: string;
  setDocumentData?: React.Dispatch<React.SetStateAction<TDocumentData | null>>;
  isPreview?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const videoTrackerRef = useRef<ReturnType<typeof createVideoTracker> | null>(
    null,
  );

  // Initialize video tracker
  useEffect(() => {
    if (!videoRef.current) return;

    videoTrackerRef.current = createVideoTracker(videoRef.current, {
      linkId,
      documentId,
      viewId,
      dataroomId,
      versionNumber,
      isMuted: false,
      isFocused: isWindowFocused,
      isFullscreen: false,
      isPreview,
      playbackRate: 1,
      volume: 1,
    });

    return () => {
      videoTrackerRef.current?.cleanup();
    };
  }, [
    linkId,
    documentId,
    viewId,
    dataroomId,
    versionNumber,
    isPreview,
    isWindowFocused,
  ]);

  // Handle visibility change for analytics
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!videoTrackerRef.current) return;
      videoTrackerRef.current.trackVisibilityChange(
        document.visibilityState === "visible",
      );
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Handle screenshot protection
  useEffect(() => {
    if (!screenshotProtectionEnabled) return;

    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [screenshotProtectionEnabled]);

  const handleVideoError = (error: Error) => {
    console.error("Video playback error:", error);
    toast.error("Error playing video. Please try again.");
  };

  return (
    <>
      <Nav
        brand={brand}
        documentName={documentName}
        isDataroom={dataroomId ? true : false}
        setDocumentData={setDocumentData}
        isPreview={isPreview}
        allowDownload={allowDownload}
        linkId={linkId}
        documentId={documentId}
        viewId={viewId}
      />
      <div
        style={{ height: "calc(100dvh - 64px)" }}
        className={cn(
          "relative flex items-center justify-center bg-black p-4",
          !isWindowFocused &&
            screenshotProtectionEnabled &&
            "blur-xl transition-all duration-300",
        )}
      >
        <div className="relative flex h-full w-full items-center justify-center">
          <VideoPlayer
            ref={videoRef}
            videoSrc={file}
            onError={handleVideoError}
            preventDownload={!allowDownload}
          />
          {screenshotProtectionEnabled && <ScreenProtector />}
        </div>
      </div>
    </>
  );
}
