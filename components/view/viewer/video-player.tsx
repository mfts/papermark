import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  videoSrc: string;
  onError?: (error: Error) => void;
  controls?: boolean;
  className?: string;
  preventDownload?: boolean;
}

export const VideoPlayer = memo(
  forwardRef<HTMLVideoElement, VideoPlayerProps>(
    (
      {
        videoSrc,
        onError,
        controls = true,
        className = "",
        preventDownload = true,
      },
      ref,
    ) => {
      const videoRef = useRef<HTMLVideoElement>(null);

      useImperativeHandle(ref, () => videoRef.current as HTMLVideoElement);

      useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleError = (e: ErrorEvent) => {
          console.error("Video playback error:", e);
          onError?.(new Error("Failed to play video"));
        };

        video.addEventListener("error", handleError);

        return () => {
          video.removeEventListener("error", handleError);
        };
      }, [onError]);

      return (
        <video
          ref={videoRef}
          className={cn("max-h-full max-w-full object-contain", className)}
          preload="metadata"
          playsInline
          controls={controls}
          controlsList={
            preventDownload ? "nodownload noremoteplayback" : undefined
          }
          onContextMenu={
            preventDownload ? (e) => e.preventDefault() : undefined
          }
          src={videoSrc}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    },
  ),
);

VideoPlayer.displayName = "VideoPlayer";
