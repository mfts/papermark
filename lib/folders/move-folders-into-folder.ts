import {toast} from "sonner";
import {mutate} from "swr";

type BaseProps = {
    selectedFolderIds: string | string[];
    newParentFolderId: null | string; // if null means new desired parent is root
    selectedFoldersPathName?: string[]; // if undefined means selected folders exist at the root
    teamId ?: string;
};

const isPlural = (n:number) => n > 1;
const isString = (val:unknown) => typeof val === 'string';

type Props = BaseProps & {
    API_ENDPOINT: string;
    //base_path should not end with '/'
    BASE_PATH: string;
}

//Base function
const moveFolder = async({
    selectedFolderIds,
    newParentFolderId,
    selectedFoldersPathName, 
    teamId,
    API_ENDPOINT,
    BASE_PATH
}: Props) => {
    if (!teamId) {
        toast.error("Team is required to move folders");
        return;
    };

    const selectedFoldersExistAtRoot = selectedFoldersPathName === undefined;

    if (BASE_PATH.endsWith("/")){
        BASE_PATH = BASE_PATH.substring(0, BASE_PATH.length - 1)
    }

    const apiEndpointThatPointsToPathFromWhereFolderAreSelected = selectedFoldersExistAtRoot ? (
        BASE_PATH
    ) : (
        `${BASE_PATH}/${selectedFoldersPathName.join("/")}`
    );

    if (typeof selectedFolderIds === "string"){
        selectedFolderIds = [selectedFolderIds]
    };

    try {
        // Just-To-Keep-In-Mind: If one of the selected folder's name matched with newParent's child then API gonna throw error with 4xx.
        const response = await fetch(
            API_ENDPOINT , {
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
                BASE_PATH,
                apiEndpointThatPointsToPathFromWhereFolderAreSelected,   
                `${BASE_PATH}?root=true`,
                isString(pathOfNewParent) && BASE_PATH + pathOfNewParent
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
            successMessage += (" " + `including ${noOfSubFoldersUpdated} sub folder${isPlural(noOfSubFoldersUpdated) ? "s" : ""}`)
        }

        toast.success(successMessage);

    } catch {
        toast.error("Failed to move folders");
        mutate(apiEndpointThatPointsToPathFromWhereFolderAreSelected)
    }
};


export const moveFoldersIntoFolder = (
    props: BaseProps
) => {
    const BASE_PATH = `/api/teams/${props.teamId}/folders`;
    const API_ENDPOINT = `/api/teams/${props.teamId}/folders/move`;
    return moveFolder({...props, BASE_PATH, API_ENDPOINT})
};

type MoveDataroomFolderProps = BaseProps & {
    dataroomId: string
}

export const moveDataroomFolderIntoDataroomFolder = (
    props: MoveDataroomFolderProps
) => {
    const {dataroomId, ...baseProps} = props;
    const BASE_PATH = `/api/teams/${props.teamId}/datarooms/${dataroomId}/folders`;
    const API_ENDPOINT = `/api/teams/${props.teamId}/datarooms/${dataroomId}/folders/move`;
    return moveFolder({...baseProps, BASE_PATH, API_ENDPOINT})
}