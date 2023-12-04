import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import MoreHorizontal from "@/components/shared/icons/more-horizontal";
import { FolderDirectory } from "@/lib/types";
import { toast } from "sonner";
import { ActionType } from "../state-management";
import React, { Dispatch, useState } from "react";
import EditObjectNameModal from "@/components/datarooms/hierarchical/create-dataroom/edit-object-name-modal";
import { useTeam } from "@/context/team-context";

export const FolderActions = React.memo(function ({
  folderDirectory,
  currentFolderId,
  subfolderId,
  updateFolderDirectory,
}: {
  folderDirectory: FolderDirectory;
  currentFolderId: string;
  subfolderId: string;
  updateFolderDirectory: Dispatch<ActionType>;
}) {
  const [isEditObjectNameModalOpen, setIsEditObjectNameModalOpen] =
    useState<boolean>(false);
  const [editObjectMetadata, setEditObjectMetadata] = useState<{
    name: string;
    id: string;
    parentFolderId: string;
    type: "FILE" | "FOLDER";
  }>({
    name: "",
    id: "",
    parentFolderId: "",
    type: "FOLDER",
  });
  const teamInfo = useTeam();
  const handleDeleteFolder = async (folderId: string) => {
    //Delete folder from database
    const response = await fetch(`/api/datarooms/hierarchical/folders`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ folderId, teamId: teamInfo?.currentTeam?.id }),
    });

    if (!response.ok) {
      toast.error("Failed to delete folder");
      return;
    }

    //Delete folder locally
    updateFolderDirectory({
      type: "DELETE FOLDER",
      folderId,
      parentFolderId: currentFolderId,
    });
    toast.success("Folder deleted successfully");
  };

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() =>
              setTimeout(() => {
                setEditObjectMetadata({
                  name: folderDirectory[subfolderId].name,
                  id: subfolderId,
                  parentFolderId: currentFolderId,
                  type: "FOLDER",
                });
                setIsEditObjectNameModalOpen(true);
              }, 0)
            }
          >
            Edit Name
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
            onClick={() => handleDeleteFolder(subfolderId)}
          >
            Delete Folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Edit file/folder name modal */}
      <EditObjectNameModal
        isOpen={isEditObjectNameModalOpen}
        setIsOpen={setIsEditObjectNameModalOpen}
        objectMetadata={editObjectMetadata}
        updateFolderDirectory={updateFolderDirectory}
      />
    </div>
  );
});
