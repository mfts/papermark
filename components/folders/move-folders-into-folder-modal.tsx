import { useRouter } from "next/router";

import { useState, useRef } from "react";
import { useTeam } from "@/context/team-context";
import { toast } from "sonner";

import { SidebarFolderTreeSelection } from "@/components/sidebar-folders";
import { SidebarFolderTreeSelection as SidebarDataroomFolderTreeSelection } from "../datarooms/folders";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { moveDataroomFolderIntoDataroomFolder, moveFoldersIntoFolder } from "@/lib/folders/move-folders-into-folder";
import { FolderWithDocuments } from "@/lib/swr/use-documents";
import { DataroomFolderWithDocuments } from "@/lib/swr/use-dataroom";

type ModalProps = {
    open: boolean,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedFolders?: React.Dispatch<React.SetStateAction<string[]>>;
    dataroomId?: string;
    folderIds: string[];
    folderName?: string;
};
export type TSelectedFolder = { id: string | null; name: string } | null;

//util
const isString = (val:unknown) => typeof val === 'string';

export function MoveFoldersInToFolderModal({
    open, setOpen, setSelectedFolders, folderIds, folderName, dataroomId
}:ModalProps){

    const router = useRouter();
    const [selectedDestinationFolder, setSelectedDestinationFolder] = useState<TSelectedFolder>(null);
    const [loading, setLoading] = useState<boolean>(false);
  
    const teamInfo = useTeam();
    const teamId = teamInfo?.currentTeam?.id;

    // The following refs can be used to give more meaningful toast error messages to the user. 
    const selectedFoldersToBeMoved = useRef<null | (FolderWithDocuments | DataroomFolderWithDocuments)[]>(null);
    const allPossibleFoldersToBeSelected = useRef<null | (FolderWithDocuments | DataroomFolderWithDocuments)[]>(null)

    const currPath = router.query.name ? (
        isString(router.query.name) ? router.query.name : router.query.name.join("/")
    ): (
        ""
    );

    const handleSubmit = async (event:any) => {
        event.preventDefault();
        event.stopPropagation();
    
        if (!selectedDestinationFolder) return;

        if (folderIds.length === 0){
            return toast.error("No folder selected!")
        };
        
        if (selectedDestinationFolder?.id && folderIds.includes(selectedDestinationFolder.id)){
          // Even though this condition is also handled in `SidebarFolderTreeSelection` to ensure that user can't select the same folder as destinationFolder.
          return toast.error("Can't move to the same folder");
        };

        // Before making API call this block verify the validity of selection and would give more meaningful error messages to user.
        if (allPossibleFoldersToBeSelected.current && selectedFoldersToBeMoved.current){

          // Handle if same parent selected
          const oldParentEqualsNewParent = !! selectedFoldersToBeMoved.current.find(folder => folder.parentId === selectedDestinationFolder.id);
          if (oldParentEqualsNewParent){
            return toast.error("Please select a different folder other than the existing parent folder")
          };
          
          // Handle if nameConflict is found. Under a parent it is must that each child has its unique name so that a unique pathname can be produced. 
          const existingChildrenOfNewParent = allPossibleFoldersToBeSelected.current.filter(folder => folder.parentId === selectedDestinationFolder.id);
          
          const duplicateName = existingChildrenOfNewParent.find(existingChild => selectedFoldersToBeMoved.current?.some(folder => folder.name === existingChild.name))?.name;

          if (!!duplicateName){
            const newDestinationParentName = selectedDestinationFolder.id === null ? (
              'HOME'
            ) : (
              allPossibleFoldersToBeSelected.current.find(folder => folder.id === selectedDestinationFolder.id)?.name ?? "parent"
            )
            return toast.error(`Oops! A folder with the name of "${duplicateName}" already exist at "${newDestinationParentName}" directory. Each child folder must have a unique name`)
          };

        }
    
        setLoading(true);

        if (dataroomId){
          await moveDataroomFolderIntoDataroomFolder({
            selectedFolderIds: folderIds,
            newParentFolderId: selectedDestinationFolder.id!,
            selectedFoldersPathName: currPath ? currPath.split("/") : undefined,
            teamId,
            dataroomId
          })
        } else {
          await moveFoldersIntoFolder({
              selectedFolderIds: folderIds,
              newParentFolderId: selectedDestinationFolder.id!,
              selectedFoldersPathName: currPath ? currPath.split("/") : undefined,
              teamId
          });
        }

    
        setLoading(false);
        setOpen(false); // Close the modal
        setSelectedFolders?.([]); // Clear the selected folders
    };
    
    //In the folder tree selection, this func will exclude some folders which are invalid to be selected.
    const filterFoldersFn = (
      folders: any[] // FolderWithDocuments[] or DataroomFolderWithDocuments[]
    ) => {

        const selectedFolders = folders.filter(f => folderIds.includes(f.id))
        const pathsOfSelectedFolderIds = selectedFolders.map(sf => sf.path);

        // From the Tree selection exclude the selected folders and their corresponding child folders.
        const foldersInSelectionTree = folders.filter(f => !pathsOfSelectedFolderIds.some(path => f.path.startsWith(path)));

        selectedFoldersToBeMoved.current = selectedFolders;
        allPossibleFoldersToBeSelected.current = foldersInSelectionTree;

        return foldersInSelectionTree
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader className="text-start">
              <DialogTitle>
                Move
                <div className="w-[376px] truncate font-bold">
                  {folderName ? folderName : `${folderIds.length} items`}
                </div>
              </DialogTitle>
              <DialogDescription>Relocate your folder.</DialogDescription>
            </DialogHeader>
            <form>
              <div className="mb-2 max-h-[75vh] overflow-y-scroll">
                {
                  dataroomId ? (
                    <SidebarDataroomFolderTreeSelection
                      key="sidebar-dataroom-folder-tree-selection"
                      dataroomId={dataroomId}
                      selectedFolder={selectedDestinationFolder}
                      setSelectedFolder={setSelectedDestinationFolder}
                      filterFoldersFn={filterFoldersFn}
                    />
                  ) : (
                    <SidebarFolderTreeSelection
                      key="sidebar-folder-tree-selection"
                      selectedFolder={selectedDestinationFolder}
                      setSelectedFolder={setSelectedDestinationFolder}
                      filterFoldersFn={filterFoldersFn}
                    />
                  )
                }
              </div>
    
              <DialogFooter>
                <Button
                  onClick={handleSubmit}
                  className="flex h-9 w-full gap-1"
                  loading={loading}
                  disabled={!selectedDestinationFolder}
                >
                  {!selectedDestinationFolder ? (
                    "Select a folder"
                  ) : (
                    <>
                      Move to{" "}
                      <span className="font-medium">{selectedDestinationFolder.name}</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      );
};