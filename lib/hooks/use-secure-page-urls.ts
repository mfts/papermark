import { useCallback, useEffect, useRef, useState } from "react";

// Buffer time before URL expiry to refresh (5 seconds)
const EXPIRY_BUFFER = 5000;
// Default expiry for URLs (30 seconds)
const DEFAULT_EXPIRY = 30000;
// Number of pages to prefetch ahead
const PREFETCH_AHEAD = 2;
// Number of pages to keep cached behind current page
const CACHE_BEHIND = 2;
// URLs that don't need secure handling (non-S3 storage)
const NON_SECURE_URL_PATTERNS = [
  "blob.vercel-storage.com",
  "public.blob.vercel-storage.com",
];

interface CachedUrl {
  url: string;
  expiresAt: number;
  pageNumber: number;
}

interface UseSecurePageUrlsOptions {
  viewId?: string;
  linkId: string;
  documentVersionId: string;
  totalPages: number;
  isPreview?: boolean;
  // Original page file paths for fallback/metadata
  pages: {
    file: string;
    pageNumber: string;
  }[];
  // Whether to enable secure URLs (can be disabled for non-S3 storage)
  enabled?: boolean;
}

interface UseSecurePageUrlsResult {
  // Get the URL for a specific page (returns cached or fetches new)
  getPageUrl: (pageNumber: number) => string;
  // Prefetch URLs for pages around the current page
  prefetchPages: (currentPage: number) => void;
  // Check if a page URL is ready (cached and not expired)
  isPageReady: (pageNumber: number) => boolean;
  // Loading state for any page
  isLoading: boolean;
  // Error state
  error: string | null;
}

export function useSecurePageUrls({
  viewId,
  linkId,
  documentVersionId,
  totalPages,
  isPreview,
  pages,
  enabled = true,
}: UseSecurePageUrlsOptions): UseSecurePageUrlsResult {
  const [urlCache, setUrlCache] = useState<Map<number, CachedUrl>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track in-flight requests to avoid duplicates
  const pendingRequests = useRef<Set<number>>(new Set());
  // Track the last accessed page for cleanup
  const lastAccessedPage = useRef<number>(1);

  // Fetch a secure URL for a specific page
  const fetchSecureUrl = useCallback(
    async (pageNumber: number): Promise<CachedUrl | null> => {
      // Skip if already fetching this page
      if (pendingRequests.current.has(pageNumber)) {
        return null;
      }

      // Skip if disabled or invalid page
      if (!enabled || pageNumber < 1 || pageNumber > totalPages) {
        return null;
      }

      pendingRequests.current.add(pageNumber);

      try {
        const response = await fetch("/api/file/s3/get-secure-page-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            viewId,
            linkId,
            pageNumber,
            documentVersionId,
            isPreview,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch secure URL");
        }

        const data = await response.json();
        const expiresIn = data.expiresIn
          ? data.expiresIn * 1000
          : DEFAULT_EXPIRY;

        return {
          url: data.url,
          expiresAt: Date.now() + expiresIn - EXPIRY_BUFFER,
          pageNumber,
        };
      } catch (err) {
        console.error(`Failed to fetch secure URL for page ${pageNumber}:`, err);
        setError(err instanceof Error ? err.message : "Failed to fetch URL");
        return null;
      } finally {
        pendingRequests.current.delete(pageNumber);
      }
    },
    [viewId, linkId, documentVersionId, isPreview, enabled, totalPages],
  );

  // Check if a cached URL is still valid
  const isUrlValid = useCallback((cached: CachedUrl | undefined): boolean => {
    if (!cached) return false;
    return Date.now() < cached.expiresAt;
  }, []);

  // Check if a URL is from non-secure storage (like Vercel Blob)
  const isNonSecureUrl = useCallback((url: string): boolean => {
    return NON_SECURE_URL_PATTERNS.some((pattern) => url.includes(pattern));
  }, []);

  // Get URL for a page - returns cached if valid, otherwise fetches
  const getPageUrl = useCallback(
    (pageNumber: number): string => {
      const page = pages.find((p) => parseInt(p.pageNumber) === pageNumber);
      const originalUrl = page?.file ?? "";

      // If secure URLs are disabled, return the original URL
      if (!enabled) {
        return originalUrl;
      }

      // If the original URL is from non-secure storage (Vercel Blob), don't fetch secure URL
      if (originalUrl && isNonSecureUrl(originalUrl)) {
        return originalUrl;
      }

      lastAccessedPage.current = pageNumber;

      // Check cache first
      const cached = urlCache.get(pageNumber);
      if (isUrlValid(cached)) {
        return cached!.url;
      }

      // If not cached or expired, fetch in background and return original URL as fallback
      // This ensures no UI blocking - the image will reload once the secure URL is ready
      fetchSecureUrl(pageNumber).then((newCached) => {
        if (newCached) {
          setUrlCache((prev) => {
            const updated = new Map(prev);
            updated.set(pageNumber, newCached);
            return updated;
          });
        }
      });

      // Return the original URL as fallback while secure URL loads
      // In production, this will be the pre-signed URL from the initial load
      return originalUrl;
    },
    [enabled, urlCache, isUrlValid, fetchSecureUrl, pages, isNonSecureUrl],
  );

  // Prefetch URLs for pages around the current page
  const prefetchPages = useCallback(
    (currentPage: number) => {
      if (!enabled) return;

      setIsLoading(true);
      const pagesToFetch: number[] = [];

      // Helper to check if page needs secure URL
      const needsSecureUrl = (pageNum: number): boolean => {
        const page = pages.find((p) => parseInt(p.pageNumber) === pageNum);
        if (!page?.file) return true;
        return !isNonSecureUrl(page.file);
      };

      // Determine which pages to prefetch
      for (
        let i = currentPage;
        i <= Math.min(currentPage + PREFETCH_AHEAD, totalPages);
        i++
      ) {
        const cached = urlCache.get(i);
        if (
          !isUrlValid(cached) &&
          !pendingRequests.current.has(i) &&
          needsSecureUrl(i)
        ) {
          pagesToFetch.push(i);
        }
      }

      // Also ensure previous pages are cached (for going back)
      for (
        let i = Math.max(1, currentPage - CACHE_BEHIND);
        i < currentPage;
        i++
      ) {
        const cached = urlCache.get(i);
        if (
          !isUrlValid(cached) &&
          !pendingRequests.current.has(i) &&
          needsSecureUrl(i)
        ) {
          pagesToFetch.push(i);
        }
      }

      // If no pages need fetching, we're done
      if (pagesToFetch.length === 0) {
        setIsLoading(false);
        return;
      }

      // Fetch all pages in parallel
      Promise.all(pagesToFetch.map(fetchSecureUrl))
        .then((results) => {
          const validResults = results.filter(
            (r): r is CachedUrl => r !== null,
          );
          if (validResults.length > 0) {
            setUrlCache((prev) => {
              const updated = new Map(prev);
              validResults.forEach((cached) => {
                updated.set(cached.pageNumber, cached);
              });

              // Clean up old pages that are far from current page
              const minPage = Math.max(1, currentPage - CACHE_BEHIND * 2);
              const maxPage = Math.min(
                totalPages,
                currentPage + PREFETCH_AHEAD * 2,
              );
              for (const [page] of updated) {
                if (page < minPage || page > maxPage) {
                  updated.delete(page);
                }
              }

              return updated;
            });
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    [enabled, totalPages, urlCache, isUrlValid, fetchSecureUrl, pages, isNonSecureUrl],
  );

  // Check if a page URL is ready (cached and valid)
  const isPageReady = useCallback(
    (pageNumber: number): boolean => {
      if (!enabled) return true;
      const cached = urlCache.get(pageNumber);
      return isUrlValid(cached);
    },
    [enabled, urlCache, isUrlValid],
  );

  // Initial prefetch when component mounts
  useEffect(() => {
    if (enabled && viewId) {
      prefetchPages(1);
    }
  }, [enabled, viewId]);

  // Cleanup expired URLs periodically
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setUrlCache((prev) => {
        const now = Date.now();
        const updated = new Map(prev);
        let changed = false;

        for (const [page, cached] of updated) {
          if (now >= cached.expiresAt) {
            updated.delete(page);
            changed = true;
          }
        }

        return changed ? updated : prev;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [enabled]);

  return {
    getPageUrl,
    prefetchPages,
    isPageReady,
    isLoading,
    error,
  };
}
