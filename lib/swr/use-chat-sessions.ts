import useSWR from "swr";
import { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { fetcher } from "@/lib/utils";

export interface ChatSession {
    id: string;
    title: string;
    lastMessage?: {
        content: string;
        role: "user" | "assistant";
        createdAt: string;
    };
    messageCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface ChatSessionsResponse {
    sessions: ChatSession[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
        nextCursor?: string;
    };
}

const handleSWRError = (err: Error, context: string) => {
    console.error(`[SWR] Error in ${context}:`, err);
};


export function useChatSessionsInfinite({
    dataroomId,
    viewerId,
    linkId,
    enabled = true,
    limit = 20,
}: {
    dataroomId: string;
    viewerId: string;
    linkId: string;
    enabled?: boolean;
    limit?: number;
}) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const isLoadingMoreRef = useRef(false);

    const firstPageUrl = useMemo(() => {
        if (!enabled || !dataroomId || !viewerId || !linkId) {
            return null;
        }
        const params = new URLSearchParams({
            dataroomId,
            viewerId,
            linkId,
            limit: limit.toString(),
        });
        return `/api/rag/sessions?${params.toString()}`;
    }, [enabled, dataroomId, viewerId, linkId, limit]);

    const { data, error, isLoading, mutate: swrMutate } = useSWR<ChatSessionsResponse>(
        firstPageUrl,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 10000,
            onError: (err: Error) => handleSWRError(err, 'useChatSessionsInfinite'),
        }
    );
    useEffect(() => {
        if (data) {
            setSessions(data.sessions);
            setHasNextPage(data.pagination.hasNext);
            setNextCursor(data.pagination.nextCursor || null);
        }
    }, [data]);
    const loadMore = useCallback(async () => {
        if (!hasNextPage || !nextCursor || isLoadingMoreRef.current || !enabled) {
            return;
        }

        isLoadingMoreRef.current = true;
        setIsLoadingMore(true);

        try {
            const params = new URLSearchParams({
                dataroomId,
                viewerId,
                linkId,
                limit: limit.toString(),
                cursor: nextCursor,
            });

            const response = await fetch(`/api/rag/sessions?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch more sessions');
            }

            const newData: ChatSessionsResponse = await response.json();
            setSessions(prev => [...prev, ...newData.sessions]);
            setHasNextPage(newData.pagination.hasNext);
            setNextCursor(newData.pagination.nextCursor || null);
        } catch (err) {
            handleSWRError(err as Error, 'loadMore');
        } finally {
            setIsLoadingMore(false);
            isLoadingMoreRef.current = false;
        }
    }, [hasNextPage, nextCursor, enabled, dataroomId, viewerId, linkId, limit]);
    const mutate = useCallback(() => {
        setSessions([]);
        setHasNextPage(true);
        setNextCursor(null);
        swrMutate();
    }, [swrMutate]);

    const isEmpty = sessions.length === 0 && !isLoading;
    const isReachingEnd = isEmpty || !hasNextPage;

    return {
        sessions,
        error,
        isLoading,
        isLoadingMore,
        isValidating: false,
        isEmpty,
        isReachingEnd,
        hasNextPage,
        loadMore,
        mutate,
        size: Math.ceil(sessions.length / limit),
    };
}

export interface ChatSessionMessages {
    session: {
        id: string;
        title: string;
        messages: Array<{
            id: string;
            content: string;
            role: "user" | "assistant";
            createdAt: string;
        }>;
    };
}

export function useChatSessionMessages({
    sessionId,
    dataroomId,
    viewerId,
    linkId,
    enabled = true,
}: {
    sessionId: string;
    dataroomId: string;
    viewerId: string;
    linkId: string;
    enabled?: boolean;
}) {
    const url = useMemo(() => {
        if (!enabled || !sessionId || !dataroomId || !viewerId || !linkId) {
            return null;
        }

        const params = new URLSearchParams({
            dataroomId,
            viewerId,
            linkId,
        });

        return `/api/rag/sessions/${sessionId}/messages?${params.toString()}`;
    }, [enabled, sessionId, dataroomId, viewerId, linkId]);

    const { data, error, isLoading, mutate } = useSWR<ChatSessionMessages>(
        url,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 10000,
            keepPreviousData: true,
            errorRetryCount: 1,
            errorRetryInterval: 2000,
            onError: (err) => handleSWRError(err, 'useChatSessionMessages'),
        }
    );

    return {
        session: data?.session,
        isLoading,
        error,
        mutate,
    };
}
