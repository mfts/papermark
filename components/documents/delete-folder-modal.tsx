import { useState } from "react";

import { FileIcon, Folder } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";


export type TSelectedDataroom = { id: string; name: string } | null;

export function DeleteFolderModal({
  open,
  setOpen,
  folderName,
  folderId,
  documents,
  childFolders,
  isDataroom,
  handleButtonClick,
}: {
  open: boolean;
  folderId: string;
  folderName?: string;
  documents: number;
  childFolders: number;
  isDataroom?: boolean;
  handleButtonClick?: (e: React.FormEvent, folderId: string) => void;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [inputValue, setInputValue] = useState("");
  const requiredText = `confirm ${isDataroom ? "remove" : "delete"} folder`;
  const isInputValid = inputValue === requiredText;

  return (
    <Modal showModal={open} setShowModal={setOpen} noBackdropBlur>
      <div
        className="flex flex-col items-center justify-center space-y-3 border-b border-border bg-white px-4 py-4 pt-8 dark:border-gray-900 dark:bg-gray-900 sm:px-8"
        onDragStart={(e) => e.preventDefault()}
      >
        <DialogTitle>
          {isDataroom ? "Remove Folder" : "Delete Folder"}
        </DialogTitle>
        <DialogDescription>
          {isDataroom
            ? "This will remove the folder and its contents from this dataroom. The original documents will remain in your workspace."
            : "This will permanently delete the folder and all its contents, including subfolders, documents, dataroom references, and any visitor analytics."}
          <div className="mt-3 text-sm font-medium text-foreground">
            {folderName}
          </div>
          <div className="mt-3 flex items-center gap-5">
            <span className="flex items-center gap-1 text-xs font-medium text-destructive">
              <FileIcon size={15} /> {documents}{" "}
              {documents > 1 ? "documents" : "document"}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-destructive">
              <Folder size={15} /> {childFolders}{" "}
              {childFolders > 1 ? "folders" : "folder"}
            </span>
          </div>
        </DialogDescription>
      </div>

      <form
        onSubmit={async (e: React.FormEvent) => {
          e.preventDefault();
          handleButtonClick?.(e, folderId);
        }}
        className="flex flex-col space-y-6 bg-muted px-4 py-8 text-left dark:bg-gray-900 sm:px-8"
      >
        <div>
          <label
            htmlFor="verification"
            className="block text-sm text-muted-foreground"
          >
            To verify, type{" "}
            <span className="font-semibold text-foreground">
              {requiredText}
            </span>{" "}
            below
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <Input
              type="text"
              name="verification"
              id="verification"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              pattern={requiredText}
              required
              autoComplete="off"
              className="bg-white dark:border-gray-500 dark:bg-gray-800 focus:dark:bg-transparent"
            />
          </div>
        </div>
        <Button variant="destructive" type="submit" disabled={!isInputValid}>
          Confirm {isDataroom ? "remove" : "delete"} folder
        </Button>
      </form>
    </Modal>
  );
}
