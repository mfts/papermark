import { useRef, useEffect, useCallback, useState } from "react";
import { trackPageViewReliably } from "../utils/reliable-tracking";

interface TrackingData {
    linkId: string;
    documentId: string;
    viewId?: string;
    duration: number;
    pageNumber: number;
    versionNumber: number;
    dataroomId?: string;
    isPreview?: boolean;
    setViewedPages?: React.Dispatch<
        React.SetStateAction<{ pageNumber: number; duration: number }[]>
    >;
}

interface TrackingOptions {
    intervalTracking?: boolean;
    intervalDuration?: number; // in milliseconds, default 10 seconds
    activityTracking?: boolean;
    inactivityThreshold?: number; // in milliseconds, default 1 minute
    enableActivityDetection?: boolean;
    externalStartTimeRef?: React.MutableRefObject<number>; // Optional external start time ref
}

export function useSafePageViewTracker(options: TrackingOptions = {}) {
    const {
        intervalTracking = true,
        intervalDuration = 10000, // 10 seconds
        activityTracking = true,
        inactivityThreshold = 60000, // 1 minute default
        enableActivityDetection = true,
        externalStartTimeRef,
    } = options;

    const hasTrackedUnloadRef = useRef<boolean>(false);
    const isTrackingRef = useRef<boolean>(false);

    // Activity tracking refs
    const lastActivityTimeRef = useRef<number>(Date.now());
    const isActiveRef = useRef<boolean>(true);
    const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
    const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const accumulatedActiveTimeRef = useRef<number>(0);

    // Add state for inactive UI display
    const [isInactive, setIsInactive] = useState<boolean>(false);

    // Use external start time ref if provided, otherwise create internal one
    const internalStartTimeRef = useRef<number>(Date.now());
    const startTimeRef = externalStartTimeRef || internalStartTimeRef;
    const lastIntervalTimeRef = useRef<number>(startTimeRef.current);

    // Activity detection
    const updateActivity = useCallback(() => {
        const now = Date.now();

        if (!isActiveRef.current) {
            // User became active again, reset tracking
            isActiveRef.current = true;
            lastIntervalTimeRef.current = now;
            setIsInactive(false); // Clear inactive state
        }

        lastActivityTimeRef.current = now;

        // Clear existing inactivity timeout
        if (inactivityTimeoutRef.current) {
            clearTimeout(inactivityTimeoutRef.current);
        }

        // Set new inactivity timeout
        if (activityTracking) {
            inactivityTimeoutRef.current = setTimeout(() => {
                if (isActiveRef.current) {
                    // User became inactive, accumulate the active time
                    const activeTime = Date.now() - lastIntervalTimeRef.current;
                    accumulatedActiveTimeRef.current += activeTime;
                    isActiveRef.current = false;
                    setIsInactive(true); // Set inactive state for UI
                }
            }, inactivityThreshold);
        }
    }, [activityTracking, inactivityThreshold]);

    // Start initial inactivity timeout
    const startInactivityTimeout = useCallback(() => {
        if (!activityTracking) return;

        // Clear any existing timeout
        if (inactivityTimeoutRef.current) {
            clearTimeout(inactivityTimeoutRef.current);
        }

        // Set initial inactivity timeout
        inactivityTimeoutRef.current = setTimeout(() => {
            if (isActiveRef.current) {
                // User became inactive, accumulate the active time
                const activeTime = Date.now() - lastIntervalTimeRef.current;
                accumulatedActiveTimeRef.current += activeTime;
                isActiveRef.current = false;
                setIsInactive(true); // Set inactive state for UI
            }
        }, inactivityThreshold);
    }, [activityTracking, inactivityThreshold]);

    // Setup activity listeners
    useEffect(() => {
        if (!enableActivityDetection) return;

        const events = ['mousedown', 'mousemove', 'keydown', 'keyup', 'scroll', 'touchstart', 'click'];

        events.forEach(event => {
            document.addEventListener(event, updateActivity, true);
        });

        // Start the initial inactivity timeout when activity detection is enabled
        startInactivityTimeout();

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, updateActivity, true);
            });
        };
    }, [updateActivity, enableActivityDetection, startInactivityTimeout]);

    const trackPageViewSafely = useCallback(async (
        data: TrackingData,
        useBeacon: boolean = false,
    ): Promise<void> => {
        // Prevent concurrent tracking calls
        if (isTrackingRef.current) return;

        // Prevent duplicate unload tracking
        if (useBeacon && hasTrackedUnloadRef.current) return;

        isTrackingRef.current = true;

        if (useBeacon) {
            hasTrackedUnloadRef.current = true;
        }

        try {
            // Update viewed pages if setter is provided
            if (data.setViewedPages) {
                data.setViewedPages((prevViewedPages) =>
                    prevViewedPages.map((page) =>
                        page.pageNumber === data.pageNumber
                            ? { ...page, duration: page.duration + data.duration }
                            : page,
                    ),
                );
            }

            // Track the page view
            await trackPageViewReliably(
                {
                    linkId: data.linkId,
                    documentId: data.documentId,
                    viewId: data.viewId,
                    duration: data.duration,
                    pageNumber: data.pageNumber,
                    versionNumber: data.versionNumber,
                    dataroomId: data.dataroomId,
                    isPreview: data.isPreview,
                },
                useBeacon,
            );
        } finally {
            isTrackingRef.current = false;
        }
    }, []);

    const getActiveDuration = useCallback(() => {

        if (!activityTracking) {
            return Date.now() - startTimeRef.current;
        }

        let totalActiveTime = accumulatedActiveTimeRef.current;

        if (isActiveRef.current) {
            // Add current active session time
            totalActiveTime += Date.now() - lastIntervalTimeRef.current;
        }

        return totalActiveTime;
    }, [activityTracking]);

    const startIntervalTracking = useCallback((trackingData: Omit<TrackingData, 'duration'>) => {
        if (!intervalTracking) return;

        // Clear any existing interval
        if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
        }

        // Reset timing references
        const now = Date.now();
        startTimeRef.current = now;
        lastIntervalTimeRef.current = now;
        accumulatedActiveTimeRef.current = 0;
        isActiveRef.current = true;

        // Start the inactivity timeout for activity tracking
        startInactivityTimeout();

        intervalIdRef.current = setInterval(() => {
            const activeDuration = getActiveDuration();

            // Only track if there's meaningful active time (at least 1 second)
            if (activeDuration >= 1000) {
                trackPageViewSafely({
                    ...trackingData,
                    duration: activeDuration,
                }, false);

                // Reset counters for next interval
                accumulatedActiveTimeRef.current = 0;
                lastIntervalTimeRef.current = Date.now();
                startTimeRef.current = Date.now();
            }
        }, intervalDuration);
    }, [intervalTracking, intervalDuration, getActiveDuration, trackPageViewSafely, startInactivityTimeout]);

    const stopIntervalTracking = useCallback(() => {
        if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
            intervalIdRef.current = null;
        }
        if (inactivityTimeoutRef.current) {
            clearTimeout(inactivityTimeoutRef.current);
            inactivityTimeoutRef.current = null;
        }
    }, []);

    const resetTrackingState = useCallback(() => {
        hasTrackedUnloadRef.current = false;
        isTrackingRef.current = false;
        lastActivityTimeRef.current = Date.now();
        isActiveRef.current = true;
        accumulatedActiveTimeRef.current = 0;
        setIsInactive(false); // Clear inactive state

        const now = Date.now();
        startTimeRef.current = now;
        lastIntervalTimeRef.current = now;

        // Clear timeouts
        if (inactivityTimeoutRef.current) {
            clearTimeout(inactivityTimeoutRef.current);
            inactivityTimeoutRef.current = null;
        }

        // Restart inactivity timeout if activity tracking is enabled
        startInactivityTimeout();
    }, [startInactivityTimeout]);

    // TODO: for debugging
    // const getTrackingState = () => ({
    //     hasTrackedUnload: hasTrackedUnloadRef.current,
    //     isTracking: isTrackingRef.current,
    //     isActive: isActiveRef.current,
    //     lastActivityTime: lastActivityTimeRef.current,
    //     accumulatedActiveTime: accumulatedActiveTimeRef.current,
    // });

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopIntervalTracking();
        };
    }, [stopIntervalTracking]);

    return {
        trackPageViewSafely,
        resetTrackingState,
        // getTrackingState,
        startIntervalTracking,
        stopIntervalTracking,
        getActiveDuration,
        updateActivity,
        isInactive,
    };
} 