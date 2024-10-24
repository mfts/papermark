import { Files, Folder } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "../ui/modal";
import { CardDescription, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { useMediaQuery } from "@/lib/utils/use-media-query";

export type TSelectedDataroom = { id: string; name: string } | null;

export function DeleteFolderModal({
  open,
  setOpen,
  folderName,
  folderId,
  documents,
  childFolders,
  handleButtonClick,
}: {
  open: boolean;
  folderId: string;
  folderName?: string;
  documents: number;
  childFolders: number;
  handleButtonClick?: any;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {

  const { isMobile } = useMediaQuery();

  return (
    <Modal
    showModal={open}
    setShowModal={setOpen}
  >
    <div className="flex flex-col items-center justify-center px-4 py-4 pt-8 space-y-3 bg-white border-b border-border dark:border-gray-900 dark:bg-gray-900 sm:px-8">
      <CardTitle>Delete Folder</CardTitle>
      <CardDescription>
        Warning: This will permanently delete your folder, all associated
        folders and their respective documents.


        <div className="flex items-center gap-5 mt-3">
          <span className="flex items-center block gap-1 text-xs font-medium text-destructive">
            <Files size={15} /> {documents} {documents > 1 ? "documents" : "document"}
          </span>
          <span className="flex items-center block gap-1 text-xs font-medium text-destructive">
            <Folder size={15} /> {childFolders} {childFolders > 1 ? "folders" : "folder"}
          </span>
        </div>     

      </CardDescription>
    </div>

    <form
      onSubmit={async (e) => {
        e.preventDefault();
        handleButtonClick(e, folderId)
      }}
      className="flex flex-col px-4 py-8 space-y-6 text-left bg-muted dark:bg-gray-900 sm:px-8"
    >
      <div>
        <label
          htmlFor="dataroom-name"
          className="block text-sm font-medium text-muted-foreground"
        >
          Enter the folder name{" "}
          <span className="font-semibold text-foreground">
            {folderName}
          </span>{" "}
          to continue:
        </label>

        <div className="relative mt-1 rounded-md shadow-sm">
          <Input
            type="text"
            name="dataroom-name"
            id="dataroom-name"
            autoFocus={!isMobile}
            autoComplete="off"
            required
            pattern={folderName}
            className="bg-white dark:border-gray-500 dark:bg-gray-800 focus:dark:bg-transparent"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="verification"
          className="block text-sm text-muted-foreground"
        >
          To verify, type{" "}
          <span className="font-semibold text-foreground">
            confirm delete folder
          </span>{" "}
          below
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <Input
            type="text"
            name="verification"
            id="verification"
            pattern="confirm delete folder"
            required
            autoComplete="off"
            className="bg-white dark:border-gray-500 dark:bg-gray-800 focus:dark:bg-transparent"
          />
        </div>
      </div>
      <Button variant="destructive" >
        Confirm delete folder
      </Button>
    </form>
  </Modal>
  );
}
