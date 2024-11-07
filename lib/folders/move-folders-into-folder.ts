import {toast} from "sonner";
import {mutate} from "swr";

type Props = {
    selectedFolderIds: string | string[];
    newParentFolderId: null | string; // if null means new desired parent is root
    selectedFoldersPathName?: string[]; // if undefined means selected folders exist at the root
    teamId ?: string;
};

const apiEndpoint = (teamId:string) => `/api/teams/${teamId}/folders/move`;
const isPlural = (n:number) => n > 1;
const isString = (val:unknown) => typeof val === 'string';

export const moveFoldersIntoFolder = async({
    selectedFolderIds, newParentFolderId, selectedFoldersPathName, teamId
}:Props) => {

    if (!teamId) {
        toast.error("Team is required to move folders");
        return;
    };

    const selectedFoldersExistAtRoot = selectedFoldersPathName === undefined;

    const apiEndpointThatPointsToPathFromWhereFolderAreSelected = selectedFoldersExistAtRoot ? (
        `/api/teams/${teamId}/folders`
    ) : (
        `/api/teams/${teamId}/folders/${selectedFoldersPathName.join("/")}`
    );

    if (typeof selectedFolderIds === "string"){
        selectedFolderIds = [selectedFolderIds]
    };

    try {
        // Just-To-Keep-In-Mind: If one of the selected folder's name matched with newParent's child then API gonna throw error with 4xx.
        const response = await fetch(
            apiEndpoint(teamId),{
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    folderIds: selectedFolderIds,
                    newParentFolderId
                })
            }
        );

        if (!response.ok){
            throw new Error(`Failed to move folders, failed with status code ${response.status}`);
        };

        const {
            updatedCount,
            updatedTotalCount,
            //message,
            pathOfNewParent
        } = await response.json();

        Array.from(
            new Set([
                apiEndpointThatPointsToPathFromWhereFolderAreSelected,   
                `/api/teams/${teamId}/folders?root=true`,
                `/api/teams/${teamId}/folders`,
                isString(pathOfNewParent) && `/api/teams/${teamId}/folders` + pathOfNewParent
            ])
        ).forEach(path => path && mutate(path));

        let successMessage = isPlural(updatedCount) ? (
            `${updatedCount} folders moved successfully`
        ) : (
            `${updatedCount} folder moved successfully`
        );

        const totalFoldersThatAreUpdated = parseInt(updatedTotalCount)
        if (Number.isInteger(totalFoldersThatAreUpdated) && totalFoldersThatAreUpdated > selectedFolderIds.length){
            const noOfSubFoldersUpdated = totalFoldersThatAreUpdated - selectedFolderIds.length;
            successMessage += (" " + `including their ${noOfSubFoldersUpdated} sub folder${isPlural(noOfSubFoldersUpdated) ? "s" : ""}`)
        }

        toast.success(successMessage)

    } catch (error) {
        toast.error("Failed to move folders");
        mutate(apiEndpointThatPointsToPathFromWhereFolderAreSelected)
    }
};