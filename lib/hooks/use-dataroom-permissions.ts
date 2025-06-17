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

    return {
        applyDefaultPermissions,
        inheritParentPermissions
    };
}; 