import { useRouter } from "next/router";
import useSWR from "swr";
import { toast } from "sonner";

import { useTeam } from "@/context/team-context";
import { fetcher } from "@/lib/utils";

export interface DocumentVersion {
    id: string;
    versionNumber: number;
    isPrimary: boolean;
    hasPages: boolean;
    type: string;
    contentType: string;
    fileSize: number;
    numPages: number;
    createdAt: string;
    updatedAt: string;
    _count: {
        pages: number;
    };
    canDelete: boolean;
    canPromote: boolean;
}

export interface DocumentVersionsResponse {
    documentId: string;
    documentName: string;
    versions: DocumentVersion[];
    canManageVersions: boolean;
    pagination?: {
        currentPage: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export function useDocumentVersions(documentId?: string, page: number = 1, limit: number = 10) {
    const teamInfo = useTeam();
    const teamId = teamInfo?.currentTeam?.id;

    const { data, error, mutate } = useSWR<DocumentVersionsResponse>(
        teamId && documentId
            ? `/api/teams/${teamId}/documents/${documentId}/versions/list?page=${page}&limit=${limit}`
            : null,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000,
        }
    );

    return {
        versions: data,
        loading: !error && !data,
        error,
        mutate,
    };
}

export function useDocumentVersionActions(documentId: string) {
    const teamInfo = useTeam();
    const teamId = teamInfo?.currentTeam?.id;

    const deleteVersion = async (versionId: string) => {
        if (!teamId) return;

        try {
            const promise = fetch(
                `/api/teams/${teamId}/documents/${documentId}/versions/${versionId}`,
                {
                    method: 'DELETE',
                }
            );

            await toast.promise(promise, {
                loading: 'Deleting document version...',
                success: 'Document version deleted successfully',
                error: (err: Error) =>
                    err.message || 'Failed to delete version',
            });

            const res = await promise;

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to delete version');
            }

            return true;
        } catch (error) {
            return false;
        }
    };

    const promoteVersion = async (versionId: string) => {
        if (!teamId) return;

        try {
            const promise = fetch(
                `/api/teams/${teamId}/documents/${documentId}/versions/${versionId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ action: 'promote' }),
                }
            );

            await toast.promise(promise, {
                loading: 'Promoting document version...',
                success: 'Document version promoted to primary successfully',
                error: (err: Error) =>
                    err.message || 'Failed to promote version',
            });

            const res = await promise;

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to promote version');
            }

            return true;
        } catch (error) {
            return false;
        }
    };

    const downloadVersion = async (versionId: string) => {
        if (!teamId) return;

        try {
            const promise = fetch(
                `/api/teams/${teamId}/documents/${documentId}/versions/${versionId}?download=true`
            );

            await toast.promise(promise, {
                loading: 'Preparing download...',
                success: 'Download started',
                error: (err: Error) =>
                    err.message || 'Failed to download version',
            });

            const res = await promise;

            if (!res.ok) {
                const error = await res.json();
                throw new Error(
                    error.message || 'Failed to generate download URL'
                );
            }

            const data = await res.json();
            const link = document.createElement('a');
            link.href = data.downloadUrl;
            link.download = data.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return true;
        } catch (error) {
            return false;
        }
    };

    return {
        deleteVersion,
        promoteVersion,
        downloadVersion,
    };
} 