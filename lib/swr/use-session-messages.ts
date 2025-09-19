import useSWR from "swr";
import { useMemo, useCallback, useState, useEffect } from "react";
import { fetcher } from "@/lib/utils";

export interface SessionMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
    metadata?: any;
}

export interface SessionMessagesResponse {
    sessionId: string;
    messages: SessionMessage[];
    pagination: {
        hasNext: boolean;
        nextCursor: string | null;
    };
}

export function useSessionMessagesInfinite({
    sessionId,
    dataroomId,
    viewerId,
    linkId,
    enabled = true,
    limit = 20,
}: {
    sessionId: string | null;
    dataroomId: string;
    viewerId: string;
    linkId: string;
    enabled?: boolean;
    limit?: number;
}) {
    const [messages, setMessages] = useState<SessionMessage[]>([]);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const firstPageUrl = useMemo(() => {
        if (!enabled || !sessionId || !dataroomId || !viewerId || !linkId) {
            return null;
        }
        const params = new URLSearchParams({
            dataroomId,
            viewerId,
            linkId,
            limit: limit.toString(),
        });
        return `/api/rag/sessions/${sessionId}/messages?${params.toString()}`;
    }, [enabled, sessionId, dataroomId, viewerId, linkId, limit]);

    const { data, error, isLoading } = useSWR<SessionMessagesResponse>(
        firstPageUrl,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 10000,
            errorRetryCount: 3,
            errorRetryInterval: 1000,
        }
    );

    useEffect(() => {
        if (data) {
            setMessages(data.messages);
            setHasNextPage(data.pagination.hasNext);
            setNextCursor(data.pagination.nextCursor || null);
        }
    }, [data]);

    const loadMore = useCallback(async () => {
        if (!hasNextPage || isLoadingMore || !nextCursor) {
            return;
        }

        setIsLoadingMore(true);

        try {
            const params = new URLSearchParams({
                dataroomId,
                viewerId,
                linkId,
                limit: limit.toString(),
                cursor: nextCursor,
            });

            const response = await fetch(`/api/rag/sessions/${sessionId}/messages?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`Failed to load more messages: ${response.statusText}`);
            }

            const newData: SessionMessagesResponse = await response.json();
            setMessages(prev => [...newData.messages, ...prev]);
            setHasNextPage(newData.pagination.hasNext);
            setNextCursor(newData.pagination.nextCursor || null);
        } catch (error) {
            console.error('Failed to load more messages:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasNextPage, isLoadingMore, nextCursor, sessionId, dataroomId, viewerId, linkId, limit]);

    return {
        messages,
        isLoading,
        isLoadingMore,
        isReachingEnd: !hasNextPage,
        hasNextPage,
        error,
        loadMore,
    };
}
