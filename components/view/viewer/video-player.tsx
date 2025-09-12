import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { cn } from "@/lib/utils";

interface MediaPlayerProps {
  mediaSrc: string;
  onError?: (error: Error) => void;
  controls?: boolean;
  className?: string;
  preventDownload?: boolean;
}

export const MediaPlayer = memo(
  forwardRef<HTMLVideoElement, MediaPlayerProps>(
    (
      {
        mediaSrc,
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
          console.error("Media playback error:", e);
          onError?.(new Error("Failed to play media"));
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
          src={mediaSrc}
        >
          <source src={mediaSrc} />
          Your browser does not support the media tag.
        </video>
      );
    },
  ),
);

MediaPlayer.displayName = "MediaPlayer";

// Keep the old VideoPlayer export for backward compatibility
export const VideoPlayer = MediaPlayer;
