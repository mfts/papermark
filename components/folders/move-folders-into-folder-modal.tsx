import { useRouter } from "next/router";

import { useState } from "react";
import { useTeam } from "@/context/team-context";
import { toast } from "sonner";

import { SidebarFolderTreeSelection } from "@/components/sidebar-folders";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { moveFoldersIntoFolder } from "@/lib/folders/move-folders-into-folder";

type ModalProps = {
    open: boolean,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedFolders?: React.Dispatch<React.SetStateAction<string[]>>;
    folderIds: string[];
    folderName?: string;
};
export type TSelectedFolder = { id: string | null; name: string } | null;

//util
const isString = (val:unknown) => typeof val === 'string';

export function MoveFoldersInToFolderModal({
    open, setOpen, setSelectedFolders, folderIds, folderName
}:ModalProps){

    const router = useRouter();
    const [selectedDestinationFolder, setSelectedDestinationFolder] = useState<TSelectedFolder>(null);
    const [loading, setLoading] = useState<boolean>(false);
  
    const teamInfo = useTeam();
    const teamId = teamInfo?.currentTeam?.id;

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
        }
        
        if (selectedDestinationFolder?.id && folderIds.includes(selectedDestinationFolder.id)){
          // Even though this condition is also handled in `SidebarFolderTreeSelection` to ensure that user can't select the same folder as destinationFolder.
          return toast.error("Can't move to the same folder");
        };
    
        setLoading(true);

        await moveFoldersIntoFolder({
            selectedFolderIds: folderIds,
            newParentFolderId: selectedDestinationFolder.id!,
            selectedFoldersPathName: currPath ? currPath.split("/") : undefined,
            teamId
        });
    
        setLoading(false);
        setOpen(false); // Close the modal
        setSelectedFolders?.([]); // Clear the selected folders
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
                <SidebarFolderTreeSelection
                  selectedFolder={selectedDestinationFolder}
                  setSelectedFolder={setSelectedDestinationFolder}
                  excludeFolderIds={folderIds}
                />
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
}