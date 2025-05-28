import { useRef } from "react";
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

export function useSafePageViewTracker() {
    const hasTrackedUnloadRef = useRef<boolean>(false);
    const isTrackingRef = useRef<boolean>(false);

    const trackPageViewSafely = async (
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
    };

    const resetTrackingState = () => {
        hasTrackedUnloadRef.current = false;
        isTrackingRef.current = false;
    };

    const getTrackingState = () => ({
        hasTrackedUnload: hasTrackedUnloadRef.current,
        isTracking: isTrackingRef.current,
    });

    return {
        trackPageViewSafely,
        resetTrackingState,
        getTrackingState,
    };
} 