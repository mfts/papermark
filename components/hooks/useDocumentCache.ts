import { useCallback, useEffect, useRef, useState } from 'react';
import { documentIndexedDB } from '@/lib/indexdb/document-store';

interface CacheEntry {
    document: any;
    primaryVersion: any;
    links: any[];
    timestamp: number;
    isStale?: boolean;
}

const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours - documents rarely change frequently
const CLEANUP_INTERVAL = 90 * 60 * 1000; // 1.5 hours - less frequent cleanup for IndexedDB
const MAX_STORAGE_DURATION = 15 * 24 * 60 * 60 * 1000; // 7 days - keep documents longer
const STALE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours - use stale cache if API fails

export function useDocumentCache() {
    const [isInitialized, setIsInitialized] = useState(false);
    const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize IndexedDB and set up cleanup
    useEffect(() => {
        const initDB = async () => {
            try {
                await documentIndexedDB.init();
                setIsInitialized(true);
                console.log('Document cache initialized with IndexedDB');

                // Clean up very old documents immediately (older than 7 days)
                await documentIndexedDB.clearExpiredDocuments(MAX_STORAGE_DURATION);

                // Set up periodic cleanup - run every hour
                cleanupIntervalRef.current = setInterval(async () => {
                    try {
                        await documentIndexedDB.clearExpiredDocuments(MAX_STORAGE_DURATION);
                        // Also clean up storage if it gets too large
                        await documentIndexedDB.cleanupByStorageSize();
                    } catch (error) {
                        console.error('Failed to clean up expired documents:', error);
                    }
                }, CLEANUP_INTERVAL);

            } catch (error) {
                console.error('Failed to initialize document cache:', error);
                setIsInitialized(true);
            }
        };

        initDB();

        return () => {
            if (cleanupIntervalRef.current) {
                clearInterval(cleanupIntervalRef.current);
            }
        };
    }, []);

    const getDocument = useCallback(async (id: string): Promise<CacheEntry | null> => {
        if (!id || typeof id !== 'string') {
            console.log('Invalid document ID:', id);
            return null;
        }

        if (!isInitialized) {
            console.log('IndexedDB not initialized yet');
            return null;
        }

        try {
            const cached = await documentIndexedDB.getDocument(id);

            if (!cached) {
                console.log('Document not found in IndexedDB:', id);
                return null;
            }

            const isFresh = await documentIndexedDB.isDocumentFresh(id, CACHE_DURATION);

            if (!isFresh) {
                const isStale = await documentIndexedDB.isDocumentFresh(id, STALE_CACHE_DURATION);

                if (!isStale) {
                    await documentIndexedDB.deleteDocument(id);
                    return null;
                }

                console.log('Using stale cache for document (will refresh in background):', id);
                // Mark for background refresh
                cached.isStale = true;
            } else {
                console.log('Found fresh document in IndexedDB:', id);
            }

            return {
                document: cached.document,
                primaryVersion: cached.primaryVersion,
                links: cached.links,
                timestamp: cached.timestamp,
                isStale: cached.isStale,
            };

        } catch (error) {
            console.error('Failed to get document from IndexedDB:', error);
            return null;
        }
    }, [isInitialized]);

    const setDocument = useCallback(async (
        id: string,
        data: { document: any; primaryVersion: any; links: any[] }
    ): Promise<void> => {
        if (!id || typeof id !== 'string' || !data) {
            console.log('Invalid parameters for setDocument:', { id, data });
            return;
        }

        if (!data.document || !data.primaryVersion) {
            console.log('Missing required data fields:', data);
            return;
        }

        if (!isInitialized) {
            console.log('IndexedDB not initialized, skipping cache');
            return;
        }

        try {
            console.log('Storing document in IndexedDB:', id);
            await documentIndexedDB.setDocument(id, {
                document: data.document,
                primaryVersion: data.primaryVersion,
                links: data.links || [],
            });
            console.log('Document stored successfully in IndexedDB:', id);
        } catch (error) {
            console.error('Failed to store document in IndexedDB:', error);
        }
    }, [isInitialized]);

    const updateDocument = useCallback(async (
        id: string,
        data: { document: any; primaryVersion: any; links: any[] },
        serverVersion?: number
    ): Promise<boolean> => {
        if (!isInitialized) return false;

        try {
            console.log('Updating document in IndexedDB:', id);

            // update that respects version numbers
            const wasUpdated = await documentIndexedDB.updateDocumentIfNewer(id, {
                document: data.document,
                primaryVersion: data.primaryVersion,
                links: data.links || [],
            }, serverVersion);

            return wasUpdated;
        } catch (error) {
            console.error('Failed to update document in IndexedDB:', error);
            return false;
        }
    }, [isInitialized]);

    const removeDocument = useCallback(async (id: string): Promise<void> => {
        if (!isInitialized) return;

        try {
            await documentIndexedDB.deleteDocument(id);
            console.log('Document removed from IndexedDB:', id);
        } catch (error) {
            console.error('Failed to remove document from IndexedDB:', error);
        }
    }, [isInitialized]);

    const getCacheStats = useCallback(async (): Promise<{
        totalDocuments: number;
        totalSize: number;
        oldestDocument: number;
        newestDocument: number;
    } | null> => {
        if (!isInitialized) return null;

        try {
            return await documentIndexedDB.getCacheStats();
        } catch (error) {
            console.error('Failed to get cache stats:', error);
            return null;
        }
    }, [isInitialized]);

    const clearCache = useCallback(async (): Promise<void> => {
        if (!isInitialized) return;

        try {
            await documentIndexedDB.clearAllDocuments();
            console.log('Cache cleared successfully');
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
    }, [isInitialized]);


    return {
        getDocument,
        setDocument,
        updateDocument,
        removeDocument,
        getCacheStats,
        clearCache,
        isInitialized,
    };
} 