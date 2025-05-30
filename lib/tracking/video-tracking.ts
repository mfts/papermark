import { VIDEO_EVENT_TYPES } from "@/lib/constants";

type VideoTrackingEvent = {
  linkId: string;
  documentId: string;
  viewId?: string;
  dataroomId?: string;
  versionNumber: number;
  startTime: number;
  endTime?: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  isFocused: boolean;
  isFullscreen: boolean;
  eventType: (typeof VIDEO_EVENT_TYPES)[number];
  isPreview?: boolean;
};

type EventType = (typeof VIDEO_EVENT_TYPES)[number];

// Simple debounce implementation with immediate option
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    lastArgs = args;

    if (timeout) {
      clearTimeout(timeout);
    }

    if (immediate && !timeout) {
      func(...args);
    }

    timeout = setTimeout(() => {
      if (!immediate && lastArgs) {
        func(...lastArgs);
      }
      timeout = null;
      lastArgs = null;
    }, wait);
  };
}

class VideoTracker {
  private videoElement: HTMLVideoElement;
  private lastTrackingTime: number = 0;
  private isPlaying: boolean = false;
  private lastTimeUpdate: number = Date.now();
  private trackingConfig: Omit<
    VideoTrackingEvent,
    "startTime" | "endTime" | "eventType"
  >;
  private lastVolume: number = 1;
  private hasLoaded: boolean = false;
  private hasTrackedUnload: boolean = false;
  private debouncedTrackEvent: Record<
    EventType,
    (eventType: EventType, endTime?: number) => void
  >;
  private boundEventListeners: { [key: string]: EventListener } = {};

  constructor(
    videoElement: HTMLVideoElement,
    config: Omit<VideoTrackingEvent, "startTime" | "endTime" | "eventType">,
  ) {
    this.videoElement = videoElement;
    this.trackingConfig = config;
    this.lastVolume = videoElement.volume;

    // Create a base debounced function
    const createDebouncedHandler = (wait: number, immediate = false) =>
      debounce(
        (eventType: EventType, endTime?: number) => {
          console.log(
            `[VideoTracker] Tracking event: ${eventType} - ${endTime}`,
          );
          return this.trackEvent(eventType, endTime);
        },
        wait,
        immediate,
      );

    // Initialize debounced handlers with different wait times
    this.debouncedTrackEvent = {
      loaded: createDebouncedHandler(1000, true), // Immediate for load events
      played: createDebouncedHandler(1000),
      seeked: createDebouncedHandler(500),
      rate_changed: createDebouncedHandler(500),
      volume_up: createDebouncedHandler(500),
      volume_down: createDebouncedHandler(500),
      muted: createDebouncedHandler(500, true),
      unmuted: createDebouncedHandler(500, true),
      focus: createDebouncedHandler(500, true),
      blur: createDebouncedHandler(500, true),
      enterfullscreen: createDebouncedHandler(500, true),
      exitfullscreen: createDebouncedHandler(500, true),
    };

    this.setupEventListeners();
  }

  private addEventListenerWithCleanup(
    target: EventTarget,
    type: string,
    listener: EventListener,
  ) {
    // Store the bound listener for cleanup
    this.boundEventListeners[type] = listener;
    target.addEventListener(type, listener);
  }

  private async trackEvent(eventType: EventType, endTime?: number, useBeacon: boolean = false) {
    if (this.trackingConfig.isPreview) return;

    const currentTime = this.videoElement.currentTime;
    const payload = JSON.stringify({
      timestamp: new Date().toISOString(),
      linkId: this.trackingConfig.linkId,
      documentId: this.trackingConfig.documentId,
      viewId: this.trackingConfig.viewId,
      dataroomId: this.trackingConfig.dataroomId,
      versionNumber: this.trackingConfig.versionNumber,
      startTime: Math.round(this.lastTrackingTime),
      endTime: endTime ? Math.round(endTime) : Math.round(currentTime),
      playbackRate: this.videoElement.playbackRate,
      volume: this.videoElement.volume,
      isMuted: this.trackingConfig.isMuted,
      isFocused: this.trackingConfig.isFocused,
      isFullscreen: this.trackingConfig.isFullscreen,
      eventType,
    });

    const url = "/api/record_video_view";

    // Use sendBeacon for maximum reliability during page unload
    if (useBeacon && navigator.sendBeacon) {
      try {
        const blob = new Blob([payload], { type: "application/json" });
        const success = navigator.sendBeacon(url, blob);
        if (success) {
          this.lastTrackingTime = currentTime;
          return;
        }
      } catch (error) {
        console.warn("sendBeacon failed:", error);
      }
    }

    // Use fetch with keepalive for better reliability
    try {
      const response = await fetch(url, {
        method: "POST",
        body: payload,
        headers: {
          "Content-Type": "application/json",
        },
        keepalive: true, // Critical for page unload scenarios
      });

      if (response.ok) {
        this.lastTrackingTime = currentTime;
        return;
      }
    } catch (error) {
      console.warn("Fetch with keepalive failed:", error);
    }

    // Fallback to sendBeacon if fetch failed
    if (!useBeacon && navigator.sendBeacon) {
      try {
        const blob = new Blob([payload], { type: "application/json" });
        const success = navigator.sendBeacon(url, blob);
        if (success) {
          this.lastTrackingTime = currentTime;
          return;
        }
      } catch (error) {
        console.warn("Fallback sendBeacon failed:", error);
      }
    }

    this.lastTrackingTime = currentTime;
  }

  private setupEventListeners() {
    // Loading events - only track the first load event
    const handleLoad = () => {
      if (!this.hasLoaded) {
        this.hasLoaded = true;
        this.debouncedTrackEvent.loaded("loaded");
      }
    };

    this.addEventListenerWithCleanup(
      this.videoElement,
      "loadedmetadata",
      handleLoad,
    );
    this.addEventListenerWithCleanup(this.videoElement, "canplay", handleLoad);

    let lastPlayTime = 0;

    // Playback events
    this.addEventListenerWithCleanup(this.videoElement, "play", () => {
      const now = Date.now();
      if (this.isPlaying || now - lastPlayTime < 1000) return;

      this.isPlaying = true;
      this.lastTrackingTime = this.videoElement.currentTime;
      lastPlayTime = now;
      // Track play event with a slight delay to ensure we have the correct state
      setTimeout(() => {
        this.debouncedTrackEvent.played("played");
      }, 100);
      this.startPeriodicTracking();
    });

    let lastPauseTime = 0;

    this.addEventListenerWithCleanup(this.videoElement, "pause", () => {
      const now = Date.now();
      if (!this.isPlaying || now - lastPauseTime < 1000) return;

      this.isPlaying = false;
      lastPauseTime = now;
      this.stopPeriodicTracking();
      // Track pause event with a slight delay to ensure we have the correct state
      setTimeout(() => {
        this.debouncedTrackEvent.played("played");
      }, 100);
    });

    let seekStartTime: number | null = null;
    let isSeeking = false;

    this.addEventListenerWithCleanup(this.videoElement, "seeking", () => {
      if (isSeeking) return;
      isSeeking = true;
      seekStartTime = this.videoElement.currentTime;
    });

    this.addEventListenerWithCleanup(this.videoElement, "seeked", () => {
      if (!isSeeking) return;
      if (
        seekStartTime !== null &&
        Math.abs(seekStartTime - this.videoElement.currentTime) > 1
      ) {
        this.debouncedTrackEvent.seeked("seeked");
      }
      seekStartTime = null;
      isSeeking = false;
    });

    // Continuous playback tracking using timeupdate
    let lastTimeupdateTime = 0;
    this.addEventListenerWithCleanup(this.videoElement, "timeupdate", () => {
      const now = Date.now();
      if (this.isPlaying && now - lastTimeupdateTime >= 10000) {
        // For periodic updates, use a non-debounced direct call to ensure timing
        this.trackEvent("played");
        lastTimeupdateTime = now;
      }
    });

    // Speed events
    let lastPlaybackRate = this.videoElement.playbackRate;
    this.addEventListenerWithCleanup(this.videoElement, "ratechange", () => {
      const newRate = this.videoElement.playbackRate;
      if (Math.abs(newRate - lastPlaybackRate) < 0.01) return; // Only ignore if truly unchanged (floating point comparison)

      this.debouncedTrackEvent.rate_changed("rate_changed");
      lastPlaybackRate = newRate;
    });

    // Volume events
    this.addEventListenerWithCleanup(this.videoElement, "volumechange", () => {
      const prevMuted = this.trackingConfig.isMuted;
      const prevVolume = this.lastVolume;

      this.trackingConfig.isMuted = this.videoElement.muted;
      this.lastVolume = this.videoElement.volume;

      if (prevMuted !== this.videoElement.muted) {
        const eventType = this.videoElement.muted ? "muted" : "unmuted";
        this.debouncedTrackEvent[eventType](eventType);
      } else if (
        !this.videoElement.muted &&
        Math.abs(prevVolume - this.videoElement.volume) > 0.05
      ) {
        const eventType =
          this.videoElement.volume > prevVolume ? "volume_up" : "volume_down";
        this.debouncedTrackEvent[eventType](eventType);
      }
    });

    // Fullscreen events
    let isInFullscreen = false;
    this.addEventListenerWithCleanup(document, "fullscreenchange", () => {
      const newIsFullscreen = !!document.fullscreenElement;
      if (isInFullscreen === newIsFullscreen) return;

      isInFullscreen = newIsFullscreen;
      this.trackingConfig.isFullscreen = isInFullscreen;
      const eventType = isInFullscreen ? "enterfullscreen" : "exitfullscreen";
      this.debouncedTrackEvent[eventType](eventType);
    });

    // Handle video end
    this.addEventListenerWithCleanup(this.videoElement, "ended", () => {
      if (!this.isPlaying) return;
      this.isPlaying = false;
      this.debouncedTrackEvent.played("played");
    });
  }

  private startPeriodicTracking() {
    // Reset the timeupdate counter when starting tracking
    this.lastTimeUpdate = Date.now();
  }

  private stopPeriodicTracking() {
    // No need for cleanup as we're using the timeupdate event
  }

  public updateConfig(
    config: Partial<
      Omit<VideoTrackingEvent, "startTime" | "endTime" | "eventType">
    >,
  ) {
    this.trackingConfig = { ...this.trackingConfig, ...config };
  }

  public trackVisibilityChange(isVisible: boolean) {
    if (!isVisible && !this.hasTrackedUnload) {
      this.hasTrackedUnload = true;
      if (this.isPlaying) {
        this.trackEvent("played", undefined, true);
      }
      this.trackEvent("blur", undefined, true);
    } else if (isVisible) {
      this.hasTrackedUnload = false;
      this.trackEvent("focus");
    }
  }

  public cleanup() {
    // Remove all event listeners
    Object.entries(this.boundEventListeners).forEach(([type, listener]) => {
      const target = type === "fullscreenchange" ? document : this.videoElement;
      target.removeEventListener(type, listener);
    });

    if (this.isPlaying && !this.hasTrackedUnload) {
      this.hasTrackedUnload = true;
      this.trackEvent("played", undefined, true);
    }
  }
}

export const createVideoTracker = (
  videoElement: HTMLVideoElement,
  config: Omit<VideoTrackingEvent, "startTime" | "endTime" | "eventType">,
) => {
  return new VideoTracker(videoElement, config);
};
