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
import React, { Dispatch } from "react";
import { useState } from "react";
import EditObjectNameModal from "@/components/datarooms/hierarchical/create-dataroom/edit-object-name-modal";

export const Files = React.memo(function ({
  folderDirectory,
  currentFolderId,
  updateFolderDirectory,
}: {
  folderDirectory: FolderDirectory,
  currentFolderId: string,
  updateFolderDirectory: Dispatch<ActionType>,
}) {
  const [isEditObjectNameModalOpen, setIsEditObjectNameModalOpen] = useState<boolean>(false);
  const [editObjectMetadata, setEditObjectMetadata] = useState<{
    name: string,
    id: string,
    parentFolderId: string,
    type: "FILE" | "FOLDER"
  }>({
    name: "",
    id: "",
    parentFolderId: "",
    type: "FOLDER"
  });

  const handleDeleteFile = async (fileId: string) => {
    //Delete file from database
    const response = await fetch(`/api/datarooms/hierarchical/files`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: fileId })
    })

    if (!response.ok) {
      toast.error("Failed to delete file");
      return;
    }

    //Delete file locally
    updateFolderDirectory({ type: "DELETE FILE", fileId, parentFolderId: currentFolderId });
    toast.success("File deleted successfully");
  }

  return (
    <div>
      <div>
        {folderDirectory[currentFolderId].files.map((file) => {
          return (
            <div className="flex items-center justify-between border-b p-2" key={file.id}>
              <div className="flex items-center">
                <a
                  className="flex"
                  href={file.url}
                  target="_blank"
                >
                  <img src="/_icons/file.svg" alt="File Icon" className="w-11 h-11 mr-2" />
                  <span className="mt-3">{file.name}</span>
                </a>
              </div>
              {/* Add your Tailwind CSS classes for actions here */}
              <div className="text-center sm:text-right">
                <DropdownMenu >
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => setTimeout(() => {
                        setEditObjectMetadata({
                          name: file.name,
                          id: file.id,
                          parentFolderId: currentFolderId,
                          type: "FILE"
                        });
                        setIsEditObjectNameModalOpen(true);
                      }, 0)}
                    >
                      Edit Name
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                      onClick={() =>
                        handleDeleteFile(file.id)
                      }
                    >
                      Delete File
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}
      </div>
      {/* Edit file/folder name modal */}
      <EditObjectNameModal
        isOpen={isEditObjectNameModalOpen}
        setIsOpen={setIsEditObjectNameModalOpen}
        objectMetadata={editObjectMetadata}
        updateFolderDirectory={updateFolderDirectory}
      />
    </div>
  )
})