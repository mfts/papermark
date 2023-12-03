import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Dispatch } from "react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ActionType } from "./state-management";
import { useTeam } from "@/context/team-context";

export default function EditObjectNameModal({
  isOpen,
  setIsOpen,
  objectMetadata,
  updateFolderDirectory
}: {
  isOpen: boolean,
  setIsOpen: Dispatch<boolean>,
  objectMetadata: { name: string, id: string, parentFolderId: string, type: "FOLDER" | "FILE" },
  updateFolderDirectory: Dispatch<ActionType>
}) {
  const [updatedObjectName, setUpdatedObjectName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const teamInfo = useTeam();

  useEffect(()=>{setUpdatedObjectName(objectMetadata.name)},[objectMetadata])

  const updateObjectNameInDatabase = async () => {
    const body = objectMetadata.type === "FOLDER"
      ? { updatedFolderName: updatedObjectName, folderId: objectMetadata.id, teamId: teamInfo?.currentTeam?.id}
      : { updatedFileName: updatedObjectName, fileId: objectMetadata.id, teamId: teamInfo?.currentTeam?.id }
    const URL = `/api/datarooms/hierarchical/${objectMetadata.type === "FOLDER" ? "folders" : "files"}`
    const response = await fetch(URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
    });

    return response;
  }

  const handleEdit = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    if (!updatedObjectName) {
      return;
    }
    setLoading(true);

    const response = await updateObjectNameInDatabase();

    if (!response.ok) {
      setLoading(false);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    //Updated folderDirectory locally
    if (objectMetadata.type === "FOLDER") {
      updateFolderDirectory({ 
        type: "UPDATE FOLDERNAME", 
        folderId: objectMetadata.id, 
        name: updatedObjectName
       });
    } else {
      updateFolderDirectory({ 
        type: "UPDATE FILENAME", 
        fileId: objectMetadata.id, 
        parentFolderId: objectMetadata.parentFolderId, 
        updateFileName: updatedObjectName
       });
    }

    setLoading(false);
    const message = (await response.json()).message;
    toast.success(message);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild></DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Name</DialogTitle>
          <DialogDescription>
            Edit file/folder name
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleEdit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="domain" className="text-right">
                Name
              </Label>
              <Input
                id="domain"
                value={updatedObjectName}
                placeholder="Folder name..."
                className="col-span-3"
                onChange={(e) => setUpdatedObjectName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button loading={loading} type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}