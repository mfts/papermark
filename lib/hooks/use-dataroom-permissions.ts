import { useTeam } from "@/context/team-context";

export const useDataroomPermissions = () => {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const applyPermissions = async (
    dataroomId: string,
    documentIds: string[],
    strategy: "INHERIT_FROM_PARENT" | "ASK_EVERY_TIME" | "HIDDEN_BY_DEFAULT",
    folderPath?: string,
    onError?: (message: string) => void,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!teamId) {
      return { success: false, error: "Team ID not available" };
    }

    if (!documentIds || documentIds.length === 0) {
      return { success: false, error: "No document IDs provided" };
    }

    try {
      const response = await fetch(
        `/api/teams/${encodeURIComponent(teamId)}/datarooms/${encodeURIComponent(dataroomId)}/apply-permissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentIds,
            strategy,
            folderPath,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        onError?.(errorData.message || `HTTP ${response.status}`);
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`,
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to apply permissions:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      onError?.(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  return {
    applyPermissions,
  };
};
