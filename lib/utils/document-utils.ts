import { toast } from "sonner";
import { TeamContextType } from "@/context/team-context";
import { mutate } from "swr";

type ApproveDocumentParams = {
    documentId: string;
    teamInfo: TeamContextType | null;
    currentFolderPath?: string[];
    dataroomId?: string;
};

const getMutateEndpoint = (teamId: string, currentFolderPath?: string[], dataroomId?: string): string => {
    const basePath = `/api/teams/${teamId}`;

    if (dataroomId) {
        const folderPath = currentFolderPath ? `/folders/documents/${currentFolderPath.join("/")}` : "/documents";
        return `${basePath}/datarooms/${dataroomId}${folderPath}`;
    }

    if (currentFolderPath) {
        return `${basePath}/folders/documents/${currentFolderPath.join("/")}`;
    }

    return `${basePath}/documents`;
};

export const approveDocument = async ({
    documentId,
    teamInfo,
    currentFolderPath,
    dataroomId,
}: ApproveDocumentParams): Promise<void> => {
    if (!teamInfo?.currentTeam?.id) {
        toast.error("Team information is missing");
        return;
    }

    const endpoint = dataroomId
        ? `/datarooms/${dataroomId}/documents/${documentId}/approve`
        : `/documents/${documentId}/approve`;

    try {
        const response = await fetch(`/api/teams/${teamInfo.currentTeam.id}${endpoint}`, {
            method: "POST",
        });

        if (!response.ok) {
            throw new Error("Failed to approve document");
        }

        toast.success("Document approved successfully.");
        const mutateEndpoint = getMutateEndpoint(teamInfo.currentTeam.id, currentFolderPath, dataroomId);
        await mutate(mutateEndpoint);
    } catch (error) {
        console.error("Error approving document:", error);
        toast.error("Failed to approve document. Try again.");
        throw error;
    }
}; 