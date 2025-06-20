import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";
import { useDocumentCache } from "./useDocumentCache";
import { useSession } from "next-auth/react";
import { useTeam } from "@/context/team-context";
import { CustomUser } from "@/lib/types";

interface DocumentTab {
    id: string;
    title: string;
    isTemporary?: boolean;
}

interface LocalStorageData {
    tabs: DocumentTab[];
    lastSyncedAt: string | null;
    tabsHash: string | null;
}

async function generateTabsHash(tabs: DocumentTab[]): Promise<string> {
    const persistentTabs = tabs.filter(tab => !tab.isTemporary);
    const tabsString = persistentTabs
        .map((tab, index) => `${tab.id}:${index}`)
        .join("|");

    const encoder = new TextEncoder();
    const data = encoder.encode(tabsString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

export function useDocumentTabs() {
    const [tabs, setTabs] = useState<DocumentTab[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const router = useRouter();
    const {
        getDocument,
        setDocument,
        updateDocument,
        isInitialized
    } = useDocumentCache();
    const { data: session } = useSession();
    const { currentTeam } = useTeam();

    const hasSyncedRef = useRef(false);
    const pendingSyncRef = useRef<Promise<void> | null>(null);
    const isHandlingTabChangeRef = useRef(false);

    const getStorageKey = useCallback(() => {
        const user = session?.user as CustomUser;
        if (!user?.id || !currentTeam?.id) {
            return null;
        }
        return `documentTabs_${user.id}_${currentTeam.id}`;
    }, [session, currentTeam]);

    const getLocalData = useCallback((): LocalStorageData => {
        const storageKey = getStorageKey();
        if (!storageKey) {
            return { tabs: [], lastSyncedAt: null, tabsHash: null };
        }

        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    tabs: parsed.tabs || [],
                    lastSyncedAt: parsed.lastSyncedAt || null,
                    tabsHash: parsed.tabsHash || null,
                };
            }
        } catch (error) {
            console.error("Error parsing localStorage:", error);
        }

        return { tabs: [], lastSyncedAt: null, tabsHash: null };
    }, [getStorageKey]);

    const saveLocalData = useCallback((data: Partial<LocalStorageData>) => {
        const storageKey = getStorageKey();
        if (!storageKey) return;

        try {
            const current = getLocalData();
            const updated = { ...current, ...data };
            localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (error) {
            console.error("Error saving to localStorage:", error);
        }
    }, [getStorageKey, getLocalData]);

    const checkSyncStatus = useCallback(async (): Promise<boolean> => {
        if (!currentTeam?.id) return false;

        try {
            const response = await fetch(`/api/teams/${currentTeam.id}/document-tabs-sync`);
            if (!response.ok) return false;

            const { lastUpdatedAt, tabsHash } = await response.json();
            const local = getLocalData();

            if (!lastUpdatedAt && (!local.tabs.length || local.tabs.every(t => t.isTemporary))) {
                return false;
            }

            if (!local.lastSyncedAt) {
                return true;
            }

            // Compare timestamps
            const serverTime = new Date(lastUpdatedAt).getTime();
            const localTime = new Date(local.lastSyncedAt).getTime();

            // If server is newer, sync needed
            if (serverTime > localTime) {
                return true;
            }

            // Compare hashes to detect any differences
            const localHash = await generateTabsHash(local.tabs);
            return localHash !== tabsHash;
        } catch (error) {
            console.error("Error checking sync status:", error);
            return false;
        }
    }, [currentTeam?.id, getLocalData]);

    // Sync from server
    const syncFromServer = useCallback(async () => {
        if (!currentTeam?.id || isSyncing) return;

        setIsSyncing(true);
        try {
            const response = await fetch(`/api/teams/${currentTeam.id}/document-tabs`);
            if (!response.ok) throw new Error('Failed to fetch tabs');

            const { tabs: serverTabs } = await response.json();

            // Merge with local temporary tabs
            const local = getLocalData();
            const temporaryTabs = local.tabs.filter(tab => tab.isTemporary);
            const mergedTabs = [...serverTabs, ...temporaryTabs];

            setTabs(mergedTabs);

            // Update localStorage with server data
            const serverHash = await generateTabsHash(serverTabs);
            saveLocalData({
                tabs: mergedTabs,
                lastSyncedAt: new Date().toISOString(),
                tabsHash: serverHash,
            });

        } catch (error) {
            console.error("Error syncing from server:", error);
        } finally {
            setIsSyncing(false);
        }
    }, [currentTeam?.id, isSyncing, getLocalData, saveLocalData]);

    // Sync to server - handles deduplication and ensures only one sync at a time
    const syncToServer = useCallback(async (tabsToSync: DocumentTab[]) => {
        if (!currentTeam?.id || isSyncing) return;

        // If there's already a pending sync, wait for it
        if (pendingSyncRef.current) {
            await pendingSyncRef.current;
            return;
        }

        const syncPromise = (async () => {
            setIsSyncing(true);
            try {
                // Deduplicate tabs by documentId before sending to server
                const seenIds = new Set<string>();
                const uniqueTabs = tabsToSync.filter(tab => {
                    if (seenIds.has(tab.id)) {
                        return false; // Skip duplicate
                    }
                    seenIds.add(tab.id);
                    return true;
                });

                console.log(`Syncing ${uniqueTabs.length} unique tabs (from ${tabsToSync.length} total tabs)`);

                const response = await fetch(`/api/teams/${currentTeam.id}/document-tabs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tabs: uniqueTabs }),
                });

                if (response.ok) {
                    const persistentTabs = uniqueTabs.filter(tab => !tab.isTemporary);
                    const hash = await generateTabsHash(persistentTabs);
                    saveLocalData({
                        lastSyncedAt: new Date().toISOString(),
                        tabsHash: hash,
                    });
                } else {
                    const errorText = await response.text();
                    console.error("Sync failed:", response.status, errorText);
                }
            } catch (error) {
                console.error("Error syncing to server:", error);
            } finally {
                setIsSyncing(false);
                pendingSyncRef.current = null;
            }
        })();

        pendingSyncRef.current = syncPromise;
        await syncPromise;
    }, [currentTeam?.id, isSyncing, saveLocalData]);

    // Initial load and sync
    useEffect(() => {
        if (!isInitialized || !session || !currentTeam || hasSyncedRef.current) {
            return;
        }

        const initializeData = async () => {
            setIsLoading(true);

            // Load from localStorage immediately
            const local = getLocalData();
            if (local.tabs.length > 0) {
                setTabs(local.tabs);
            }

            // Check if sync is needed
            const needsSync = await checkSyncStatus();
            if (needsSync) {
                await syncFromServer();
            }

            hasSyncedRef.current = true;
            setIsLoading(false);
        };

        initializeData();

        // Set active tab based on current route
        if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            if (currentPath.includes('/documents/') && currentPath !== '/documents') {
                const documentId = currentPath.split('/documents/')[1];
                if (documentId) {
                    setActiveId(documentId);
                }
            }
        }
    }, [isInitialized, session, currentTeam, getLocalData, checkSyncStatus, syncFromServer]);

    // Save to localStorage when tabs change (but don't sync to server)
    useEffect(() => {
        if (!hasSyncedRef.current || isLoading) return;

        const storageKey = getStorageKey();
        if (!storageKey) return;

        // Always save to localStorage for instant UI
        saveLocalData({ tabs });
    }, [tabs, getStorageKey, saveLocalData, isLoading]);

    // Route change handling
    useEffect(() => {
        const handleRouteChange = () => {
            const currentPath = window.location.pathname;

            if (currentPath === '/documents') {
                setTabs(prevTabs => prevTabs.filter(tab => !tab.isTemporary));
                setActiveId(null);
            } else if (currentPath.includes('/documents/')) {
                const documentId = currentPath.split('/documents/')[1];
                if (documentId) {
                    setActiveId(documentId);
                }
            } else if (!currentPath.includes('/documents')) {
                setTabs(prevTabs => prevTabs.filter(tab => !tab.isTemporary));
                setActiveId(null);
            }
        };

        handleRouteChange();
        window.addEventListener('popstate', handleRouteChange);
        return () => window.removeEventListener('popstate', handleRouteChange);
    }, []);

    // Handle opening tabs
    useEffect(() => {
        const handleOpenTab = async (event: Event) => {
            // Prevent infinite loops
            if (isHandlingTabChangeRef.current) {
                return;
            }

            const customEvent = event as CustomEvent<{
                id: string;
                title: string;
                isTemporary?: boolean;
                data?: any;
            }>;
            const { id, title, data } = customEvent.detail;
            const isTemporary = customEvent.detail.isTemporary !== false;

            if (data) {
                try {
                    await setDocument(id, data);
                } catch (error) {
                    console.error("Error storing document:", error);
                }
            }

            setTabs(prevTabs => {
                const existingTabIndex = prevTabs.findIndex(tab => tab.id === id);

                if (existingTabIndex !== -1) {
                    // Update existing tab
                    const existingTab = prevTabs[existingTabIndex];
                    const updatedTabs = [...prevTabs];
                    updatedTabs[existingTabIndex] = {
                        ...existingTab,
                        title,
                        isTemporary: existingTab.isTemporary === false ? false : isTemporary
                    };
                    return updatedTabs;
                }

                // Add new tab, ensuring no duplicates
                const newTab = { id, title, isTemporary };
                const updatedTabs = [...prevTabs, newTab];

                // Deduplicate by id (just in case)
                const seenIds = new Set<string>();
                const uniqueTabs = updatedTabs.filter(tab => {
                    if (seenIds.has(tab.id)) {
                        return false;
                    }
                    seenIds.add(tab.id);
                    return true;
                });

                return uniqueTabs;
            });

            setActiveId(id);
        };

        window.addEventListener("openDocumentTab", handleOpenTab);
        return () => window.removeEventListener("openDocumentTab", handleOpenTab);
    }, [setDocument]);

    const handleTabChange = useCallback(async (tabId: string) => {
        if (!tabId || typeof tabId !== 'string') {
            console.log('Invalid tab ID:', tabId);
            return;
        }

        // Prevent infinite loops
        if (isHandlingTabChangeRef.current) {
            return;
        }

        isHandlingTabChangeRef.current = true;
        setActiveId(tabId);

        try {
            const cachedDoc = await getDocument(tabId);

            // Only dispatch event if we have new data to set
            if (cachedDoc && cachedDoc.document) {
                // Update the tab with correct info, but don't trigger another tab change
                setTabs(prevTabs => {
                    const existingTabIndex = prevTabs.findIndex(tab => tab.id === tabId);
                    if (existingTabIndex !== -1) {
                        const updatedTabs = [...prevTabs];
                        updatedTabs[existingTabIndex] = {
                            ...updatedTabs[existingTabIndex],
                        title: cachedDoc.document.name || `Document ${tabId}`,
                        };
                        return updatedTabs;
                    }
                    return prevTabs;
                });
            }
        } catch (error) {
            console.error("Error loading document:", error);
        } finally {
            isHandlingTabChangeRef.current = false;
        }

        router.push(`/documents/${tabId}`);
    }, [router, getDocument]);

    const handleTabClose = useCallback(async (tabId: string) => {
        if (!tabId || typeof tabId !== 'string') {
            console.log('Invalid tab ID for close:', tabId);
            return;
        }

        let tabToRemove: DocumentTab | undefined;
        let remainingTabs: DocumentTab[] = [];

        // Update state and capture what we need for sync
        setTabs(prevTabs => {
            tabToRemove = prevTabs.find(tab => tab.id === tabId);
            remainingTabs = prevTabs.filter(tab => tab.id !== tabId);
            return remainingTabs;
        });

        const isPermanentTab = tabToRemove && !tabToRemove.isTemporary;
        if (isPermanentTab) {
            await syncToServer(remainingTabs);
        }

        // Handle navigation
        if (tabId === activeId) {
            const currentIndex = tabs.findIndex(tab => tab.id === tabId);
            const nextTab = remainingTabs[currentIndex] || remainingTabs[currentIndex - 1];

            if (nextTab && nextTab.id) {
                handleTabChange(nextTab.id);
            } else {
                router.push("/documents");
            }
        }
    }, [activeId, router, handleTabChange, syncToServer, tabs]);

    const reorderTabs = useCallback(async (oldIndex: number, newIndex: number) => {
        let newTabsState: DocumentTab[] = [];

        setTabs(prevTabs => {
            const newTabs = [...prevTabs];
            const [removed] = newTabs.splice(oldIndex, 1);
            newTabs.splice(newIndex, 0, removed);
            newTabsState = newTabs;
            return newTabs;
        });

        // If any permanent tabs were reordered, sync to server
        const permanentTabs = newTabsState.filter(tab => !tab.isTemporary);
        if (permanentTabs.length > 0) {
            await syncToServer(newTabsState);
        }
    }, [syncToServer]);

    const pinCurrentTab = useCallback(async () => {
        if (!activeId) return;

        let updatedTabsState: DocumentTab[] = [];

        setTabs(prevTabs => {
            const updatedTabs = prevTabs.map(tab =>
                tab.id === activeId
                    ? { ...tab, isTemporary: false }
                    : tab
            );
            updatedTabsState = updatedTabs;
            return updatedTabs;
        });

        // Sync to server since a tab became permanent
        await syncToServer(updatedTabsState);
    }, [activeId, syncToServer]);

    const isOnDocumentPage = useCallback(() => {
        if (typeof window === 'undefined') return false;
        const path = window.location.pathname;
        return path.includes('/documents/') && path !== '/documents';
    }, []);

    const isCurrentTabTemporary = useCallback(() => {
        if (!activeId) return false;
        const currentTab = tabs.find(tab => tab.id === activeId);
        return currentTab?.isTemporary === true;
    }, [activeId, tabs]);

    // Force sync function for manual refresh
    const forceSync = useCallback(async () => {
        hasSyncedRef.current = false;
        await syncFromServer();
        hasSyncedRef.current = true;
    }, [syncFromServer]);

    return {
        tabs,
        activeId,
        isLoading,
        isSyncing,
        handleTabChange,
        handleTabClose,
        reorderTabs,
        getDocument,
        pinCurrentTab,
        isOnDocumentPage,
        isCurrentTabTemporary,
        forceSync,
    };
} 