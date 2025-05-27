import { toast } from "sonner";
import { mutate } from "swr";
import { TeamContextType } from "@/context/team-context";

interface UseTrashOperationsProps {
    teamInfo: TeamContextType | null;
    dataroomId: string;
    root?: boolean;
    name?: string[];
}

interface TrashOperationOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export function useTrashOperations({
    teamInfo,
    dataroomId,
    root,
    name,
}: UseTrashOperationsProps) {
    const getTrashPath = () => {
        return `${root ? "?root=true" : name ? `/${name.join("/")}` : ""}`;
    };

    const mutateTrashData = () => {
        mutate(
            `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/trash${getTrashPath()}`,
        );
        mutate(`/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/folders`);
        mutate(`/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/trash`);
        mutate(`/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/documents`);
        mutate(`/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/folders?root=true`);
    };

    const handleRestore = async (
        itemId: string,
        itemType: "document" | "folder",
        options?: TrashOperationOptions,
    ) => {
        if (name && name.length > 0) {
            toast.error(`Cannot restore ${itemType}, restore path not found!`);
            return;
        }

        toast.promise(
            fetch(
                `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/trash/manage/${itemId}/restore`,
                {
                    method: "PUT",
                },
            )
                .then((response) => {
                    if (!response.ok) {
                        if (response.status === 400) {
                            throw new Error('Restore path not found!');
                        } else {
                            throw new Error(`Failed to restore, try again later!`);
                        }
                    }
                    mutateTrashData();
                    options?.onSuccess?.();
                    return response;
                })
                .catch((error) => {
                    options?.onError?.(error);
                    throw error;
                }),
            {
                loading: `Restoring ${itemType}...`,
                success: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} restored successfully`,
                error: (error) => error.message,
            },
        );
    };

    const handleDelete = async (
        itemId: string,
        itemType: "document" | "folder",
        options?: TrashOperationOptions,
    ) => {
        toast.promise(
            fetch(
                `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/trash/manage/${itemId}`,
                {
                    method: "DELETE",
                },
            )
                .then((res) => {
                    if (!res.ok) {
                        throw new Error(`Failed to delete ${itemType}`);
                    }
                    mutateTrashData();
                    options?.onSuccess?.();
                })
                .catch((error) => {
                    options?.onError?.(error);
                    throw error;
                }),
            {
                loading: `Deleting ${itemType} permanently...`,
                success: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted permanently`,
                error: (error) => error.message,
            },
        );
    };

    const handleBulkRestore = async (
        items: { id: string; type: "document" | "folder" }[],
        options?: TrashOperationOptions,
    ) => {
        if (items.length === 0) {
            toast.error("No items selected");
            return;
        }

        if (name && name.length > 0) {
            toast.error("Cannot restore items, restore path not found!");
            return;
        }

        toast.promise(
            Promise.all(
                items.map((item) =>
                    fetch(
                        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/trash/manage/${item.id}/restore`,
                        {
                            method: "PUT",
                        },
                    ).then((response) => {
                        if (!response.ok) {
                            if (response.status === 400) {
                                throw new Error('Restore path not found!');
                            } else {
                                throw new Error(`Failed to restore, try again later!`);
                            }
                        }
                        mutateTrashData();
                        options?.onSuccess?.();
                        return response;
                    })
                ),
            ).catch((error) => {
                options?.onError?.(error);
                throw error;
            }),
            {
                loading: "Restoring items...",
                success: "Items restored successfully",
                error: (error) => error.message,
            },
        );
    };

    const handleBulkDelete = async (
        items: { id: string; type: "document" | "folder" }[],
        options?: TrashOperationOptions,
    ) => {
        toast.promise(
            Promise.all(
                items.map((item) =>
                    fetch(
                        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/trash/manage/${item.id}`,
                        {
                            method: "DELETE",
                        },
                    )
                ),
            )
                .then(() => {
                    mutateTrashData();
                    options?.onSuccess?.();
                })
                .catch((error) => {
                    options?.onError?.(error);
                    throw error;
                }),
            {
                loading: "Deleting items...",
                success: "Items deleted successfully",
                error: "Failed to delete items",
            },
        );
    };

    return {
        handleRestore,
        handleDelete,
        handleBulkRestore,
        handleBulkDelete,
    };
} 