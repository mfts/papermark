interface TrackingData {
    linkId: string;
    documentId: string;
    viewId?: string;
    duration: number;
    pageNumber: number;
    versionNumber: number;
    dataroomId?: string;
    isPreview?: boolean;
}

interface TrackingOptions {
    retryAttempts?: number;
    retryDelay?: number;
}

export async function trackPageViewReliably(
    data: TrackingData,
    useBeacon: boolean = false,
    options: TrackingOptions = {}
): Promise<void> {
    // If the view is a preview, do not track the view
    if (data.isPreview) return;

    const {
        retryAttempts = 3,
        retryDelay = 1000
    } = options;
    const payload = JSON.stringify(data);
    const url = "/api/record_view";

    // 1: Use sendBeacon for maximum reliability during page unload
    if (useBeacon && navigator.sendBeacon) {
        try {
            const blob = new Blob([payload], { type: "application/json" });
            const success = navigator.sendBeacon(url, blob);

            if (success) {
                return;
            }
        } catch (error) {
            console.warn("sendBeacon failed:", error);
        }
    }

    // 2: Use fetch with keepalive for better reliability
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
            return;
        }
    } catch (error) {
        console.warn("Fetch with keepalive failed:", error);
    }

    // 3: Fallback to sendBeacon if fetch failed
    if (!useBeacon && navigator.sendBeacon) {
        try {
            const blob = new Blob([payload], { type: "application/json" });
            const success = navigator.sendBeacon(url, blob);

            if (success) {
                return;
            }
        } catch (error) {
            console.warn("Fallback sendBeacon failed:", error);
        }
    }

    // 4: Retry with exponential backoff (only if not during page unload)
    if (!useBeacon && retryAttempts > 0) {
        for (let attempt = 1; attempt <= retryAttempts; attempt++) {
            try {
                await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));

                const response = await fetch(url, {
                    method: "POST",
                    body: payload,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    keepalive: true,
                });

                if (response.ok) {
                    return;
                }
            } catch (error) {
                console.warn(`Retry attempt ${attempt} failed:`, error);
            }
        }
    }

    // 5: Last resort - Image beacon (limited payload size)
    if (payload.length < 2000) { // URL length limit
        try {
            const img = new Image();
            const params = new URLSearchParams({ data: payload });
            img.src = `${url}?${params.toString()}`;

            // Don't wait for image to load, just fire and forget
            return;
        } catch (error) {
            console.warn("Image beacon fallback failed:", error);
        }
    }

    console.error("All tracking strategies failed - data may be lost");
}

export async function trackPageView(data: TrackingData): Promise<void> {
    return trackPageViewReliably(data, false);
} 