import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";

import { SidebarFolderTreeSelection as DataroomFolderTree } from "@/components/datarooms/folders";
import { TSelectedFolder } from "@/components/documents/move-folder-modal";
import { SidebarFolderTreeSelection as AllDocFolderTree } from "@/components/sidebar-folders";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function FolderSelectionModal({
  open,
  setOpen,
  value,
  handleSelectFolder,
  handleModalClose,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value?: { name: string; id: string };
  handleSelectFolder: (id: string, name: string) => void;
  handleModalClose: (open: boolean) => void;
}) {
  const [selectedFolder, setSelectedFolder] = useState<TSelectedFolder | null>(
    null,
  );

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();
    if (!selectedFolder?.id)
      return toast.error('Please select a folder, Can not select "Home"');
    handleSelectFolder(selectedFolder.id, selectedFolder.name);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => handleModalClose(open)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Select Folder</DialogTitle>
          <DialogDescription>
            Select folder location to upload file.
          </DialogDescription>
        </DialogHeader>
        <form>
          <div className="mb-2 max-h-[75vh] overflow-y-scroll">
            {value?.id && value?.id !== "all_documents" ? (
              <DataroomFolderTree
                dataroomId={value?.id}
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
              />
            ) : (
              <AllDocFolderTree
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
              />
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={handleSubmit}
              className="flex h-9 w-full gap-1"
              disabled={!selectedFolder}
            >
              {!selectedFolder ? (
                "Select a folder"
              ) : (
                <>
                  Select{" "}
                  <span className="font-medium">{selectedFolder.name}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
