import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDocumentCache } from "./useDocumentCache";

interface DocumentTab {
    id: string;
    title: string;
    isTemporary?: boolean;
}

export function useDocumentTabs() {
    const [tabs, setTabs] = useState<DocumentTab[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const router = useRouter();
    const {
        getDocument,
        setDocument,
        updateDocument,
        isInitialized
    } = useDocumentCache();

    useEffect(() => {
        const savedTabs = localStorage.getItem("documentTabs");
        if (savedTabs) {
            const parsedTabs = JSON.parse(savedTabs);
            const persistentTabs = parsedTabs.filter((tab: DocumentTab) => !tab.isTemporary);
            setTabs(persistentTabs);
        }

        if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            if (currentPath.includes('/documents/') && currentPath !== '/documents') {
                const documentId = currentPath.split('/documents/')[1];
                if (documentId) {
                    setActiveId(documentId);
                }
            }
        }
    }, [isInitialized]);

    useEffect(() => {
        if (tabs.length > 0) {
            const persistentTabs = tabs.filter(tab => !tab.isTemporary);
            if (persistentTabs.length > 0) {
                localStorage.setItem("documentTabs", JSON.stringify(persistentTabs));
            } else {
                localStorage.removeItem("documentTabs");
            }
        } else {
            localStorage.removeItem("documentTabs");
        }
    }, [tabs]);

    useEffect(() => {
        const handleRouteChange = () => {
            const currentPath = window.location.pathname;

            // If on documents list page, remove temporary tabs
            if (currentPath === '/documents') {
                setTabs(prevTabs => prevTabs.filter(tab => !tab.isTemporary));
                setActiveId(null);
            }
            // If on a specific document page, set as active
            else if (currentPath.includes('/documents/')) {
                const documentId = currentPath.split('/documents/')[1];
                if (documentId) {
                    setActiveId(documentId);
                }
            }
            else if (!currentPath.includes('/documents')) {
                setTabs(prevTabs => prevTabs.filter(tab => !tab.isTemporary));
                setActiveId(null);
            }
        };


        handleRouteChange();

        window.addEventListener('popstate', handleRouteChange);
        return () => window.removeEventListener('popstate', handleRouteChange);
    }, []);

    useEffect(() => {
        const handleOpenTab = async (event: Event) => {
            const customEvent = event as CustomEvent<{
                id: string;
                title: string;
                isTemporary?: boolean;
                data?: {
                    document: any;
                    primaryVersion: any;
                    links: any[];
                };
            }>;
            const { id, title, data } = customEvent.detail;

            const isTemporary = customEvent.detail.isTemporary !== false;

            if (data) {
                // Store or update document in IndexedDB
                try {
                    await setDocument(id, data);
                } catch (error) {
                    console.error("Error storing document:", error);
                }
            }

            setTabs(prevTabs => {
                const existingTabIndex = prevTabs.findIndex(tab => tab.id === id);

                if (existingTabIndex !== -1) {
                    const existingTab = prevTabs[existingTabIndex];
                    const updatedTabs = [...prevTabs];
                    updatedTabs[existingTabIndex] = {
                        ...existingTab,
                        title,
                        isTemporary: existingTab.isTemporary === false ? false : isTemporary
                    };
                    return updatedTabs;
                }
                return [...prevTabs, { id, title, isTemporary }];
            });

            setActiveId(id);
        };

        window.addEventListener("openDocumentTab", handleOpenTab);
        return () => {
            window.removeEventListener("openDocumentTab", handleOpenTab);
        };
    }, [setDocument]);

    const handleTabChange = useCallback(async (tabId: string) => {
        if (!tabId || typeof tabId !== 'string') {
            console.log('Invalid tab ID:', tabId);
            return;
        }

        setActiveId(tabId);

        try {
            const cachedDoc = await getDocument(tabId);
            if (cachedDoc && cachedDoc.document) {
                // If we have cached data, use it immediately
                const event = new CustomEvent("openDocumentTab", {
                    detail: {
                        id: tabId,
                        title: cachedDoc.document.name || `Document ${tabId}`,
                        isTemporary: true,
                        data: cachedDoc
                    }
                });
                window.dispatchEvent(event);
            }
        } catch (error) {
            console.error("Error loading document:", error);
        }

        router.push(`/documents/${tabId}`);
    }, [router, getDocument]);

    const handleTabClose = useCallback((tabId: string) => {
        if (!tabId || typeof tabId !== 'string') {
            console.log('Invalid tab ID for close:', tabId);
            return;
        }

        setTabs(prevTabs => prevTabs.filter(tab => tab.id !== tabId));

        if (tabId === activeId) {
            const remainingTabs = tabs.filter(tab => tab.id !== tabId);
            const currentIndex = tabs.findIndex(tab => tab.id === tabId);
            const nextTab = remainingTabs[currentIndex] || remainingTabs[currentIndex - 1];

            if (nextTab && nextTab.id) {
                handleTabChange(nextTab.id);
            } else {
                router.push("/documents");
            }
        }
    }, [tabs, activeId, router, handleTabChange]);

    const reorderTabs = useCallback((oldIndex: number, newIndex: number) => {
        setTabs(prevTabs => {
            const newTabs = [...prevTabs];
            const [removed] = newTabs.splice(oldIndex, 1);
            newTabs.splice(newIndex, 0, removed);
            return newTabs;
        });
    }, []);

    const pinCurrentTab = useCallback(() => {
        if (!activeId) return;

        setTabs(prevTabs =>
            prevTabs.map(tab =>
                tab.id === activeId
                    ? { ...tab, isTemporary: false }
                    : tab
            )
        );
    }, [activeId]);

    // Check if we're on a document page (not document list)
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

    return {
        tabs,
        activeId,
        handleTabChange,
        handleTabClose,
        reorderTabs,
        getDocument,
        pinCurrentTab,
        isOnDocumentPage,
        isCurrentTabTemporary,
    };
} 