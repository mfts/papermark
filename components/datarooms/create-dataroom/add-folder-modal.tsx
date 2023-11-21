import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction } from "react";
import { Label } from "@/components/ui/label";
import { ActionType } from "@/pages/datarooms/[dataroomId]/[...path]";

export default function AddFolderModal({ 
  children,
  updateFolderDirectory,
  parentFolderId
 }: { 
  children: React.ReactNode,
  updateFolderDirectory: Dispatch<ActionType>,
  parentFolderId: string
 }) {
  const [folderName, setFolderName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const router = useRouter();

  const handleFolderCreation = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    if (!folderName) {
      return;
    }
    setLoading(true);

    const { dataroomId, path } = router.query as { dataroomId: string, path: string[] };
    const body = { folderName, dataroomId, parentFolderId: path[path.length - 1] }
    const response = await fetch(`/api/datarooms/hierarchical-datarooms/folders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      setLoading(false);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const folder = data.folder;
    updateFolderDirectory({type: "CREATE FOLDER", parentFolderId, folder: folder});    setLoading(false);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Folder</DialogTitle>
          <DialogDescription>
            Add new folder within current folder
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleFolderCreation}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="domain" className="text-right">
                Name
              </Label>
              <Input
                id="domain"
                placeholder="Folder name..."
                className="col-span-3"
                onChange={(e) => setFolderName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button loading={loading} type="submit">Create Folder</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}