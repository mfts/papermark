import { useTeam } from "@/context/team-context";

export const useDataroomPermissions = () => {
    const teamInfo = useTeam();
    const teamId = teamInfo?.currentTeam?.id;

    const applyDefaultPermissions = async (
        dataroomId: string,
        documentIds: string[],
    ): Promise<{ success: boolean; error?: string }> => {
        if (!teamId) {
            return { success: false, error: "Team ID not available" };
        }

        if (!documentIds || documentIds.length === 0) {
            return { success: false, error: "No document IDs provided" };
        }

        try {
            const response = await fetch(
                `/api/teams/${encodeURIComponent(teamId)}/datarooms/${encodeURIComponent(dataroomId)}/groups/apply-default-permissions`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        documentIds,
                    }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: errorData.message || `HTTP ${response.status}`
                };
            }

            return { success: true };
        } catch (error) {
            console.error("Failed to apply default permissions:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error"
            };
        }
    };

    const inheritParentPermissions = async (
        dataroomId: string,
        documentIds: string[],
        folderPath?: string,
    ): Promise<{ success: boolean; error?: string }> => {
        if (!teamId) {
            return { success: false, error: "Team ID not available" };
        }

        if (!documentIds || documentIds.length === 0) {
            return { success: false, error: "No document IDs provided" };
        }

        try {
            const response = await fetch(
                `/api/teams/${encodeURIComponent(teamId)}/datarooms/${encodeURIComponent(dataroomId)}/groups/inherit-parent-permissions`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        documentIds,
                        folderPath,
                    }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: errorData.message || `HTTP ${response.status}`
                };
            }

            return { success: true };
        } catch (error) {
            console.error("Failed to inherit parent permissions:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error"
            };
        }
    };

    const applyDefaultPermissionGroupPermissions = async (
        dataroomId: string,
        documentIds: string[],
    ): Promise<{ success: boolean; error?: string }> => {
        if (!teamId) {
            return { success: false, error: "Team ID not available" };
        }

        if (!documentIds || documentIds.length === 0) {
            return { success: false, error: "No document IDs provided" };
        }

        try {
            const response = await fetch(
                `/api/teams/${encodeURIComponent(teamId)}/datarooms/${encodeURIComponent(dataroomId)}/permission-groups/apply-default-permissions`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        documentIds,
                    }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: errorData.message || `HTTP ${response.status}`
                };
            }

            return { success: true };
        } catch (error) {
            console.error("Failed to apply default permission group permissions:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error"
            };
        }
    };

    const inheritParentPermissionGroupPermissions = async (
        dataroomId: string,
        documentIds: string[],
        folderPath?: string,
    ): Promise<{ success: boolean; error?: string }> => {
        if (!teamId) {
            return { success: false, error: "Team ID not available" };
        }

        if (!documentIds || documentIds.length === 0) {
            return { success: false, error: "No document IDs provided" };
        }

        try {
            const response = await fetch(
                `/api/teams/${encodeURIComponent(teamId)}/datarooms/${encodeURIComponent(dataroomId)}/permission-groups/inherit-parent-permissions`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        documentIds,
                        folderPath,
                    }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: errorData.message || `HTTP ${response.status}`
                };
            }

            return { success: true };
        } catch (error) {
            console.error("Failed to inherit parent permission group permissions:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error"
            };
        }
    };

    const applyPermissionGroupPermissions = async (
        dataroomId: string,
        documentIds: string[],
        defaultLinkPermission: string,
        folderPath?: string,
        onError?: (message: string) => void,
    ): Promise<{ success: boolean; error?: string }> => {
        if (defaultLinkPermission === "inherit_from_parent") {
            try {
                const result = await inheritParentPermissionGroupPermissions(
                    dataroomId,
                    documentIds,
                    folderPath,
                );
                if (!result.success) {
                    console.error(
                        "Failed to inherit parent PermissionGroup permissions:",
                        result.error,
                    );
                    onError?.("Failed to inherit parent PermissionGroup permissions");
                }
                return result;
            } catch (error) {
                console.error(
                    "Failed to inherit parent PermissionGroup permissions:",
                    error,
                );
                onError?.("Failed to inherit parent PermissionGroup permissions");
                return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
            }
        } else if (
            defaultLinkPermission === "use_default_permissions" ||
            defaultLinkPermission === "use_simple_permissions"
        ) {
            const isRootLevel = !folderPath || folderPath.length === 0;

            if (isRootLevel) {
                try {
                    const result = await applyDefaultPermissionGroupPermissions(
                        dataroomId,
                        documentIds,
                    );
                    if (!result.success) {
                        console.error(
                            "Failed to apply default PermissionGroup permissions:",
                            result.error,
                        );
                        onError?.("Failed to apply default PermissionGroup permissions");
                    }
                    return result;
                } catch (error) {
                    console.error(
                        "Failed to apply default PermissionGroup permissions:",
                        error,
                    );
                    onError?.("Failed to apply default PermissionGroup permissions");
                    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
                }
            } else {
                try {
                    const result = await inheritParentPermissionGroupPermissions(
                        dataroomId,
                        documentIds,
                        folderPath,
                    );
                    if (!result.success) {
                        console.error(
                            "Failed to inherit parent PermissionGroup permissions:",
                            result.error,
                        );
                        onError?.("Failed to inherit parent PermissionGroup permissions");
                    }
                    return result;
                } catch (error) {
                    console.error(
                        "Failed to inherit parent PermissionGroup permissions:",
                        error,
                    );
                    onError?.("Failed to inherit parent PermissionGroup permissions");
                    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
                }
            }
        }
        return { success: true };
    };

    return {
        applyDefaultPermissions,
        inheritParentPermissions,
        applyDefaultPermissionGroupPermissions,
        inheritParentPermissionGroupPermissions,
        applyPermissionGroupPermissions
    };
}; 