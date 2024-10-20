import { Files, Folder } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="border-destructive sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle className="mb-1 text-2xl font-semibold leading-snug tracking-tight text-center">Delete Folder</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Warning: Deleting this folder will permanently remove all its contents, including any associated files or folders. If the files are part of a data room, all related data and metrics will also be deleted.

            <div className="flex items-center gap-5 mt-3">
              <span className="flex items-center block gap-1 text-xs font-medium">
                <Files size={15} /> {documents} {documents > 1 ? "documents" : "document"}
              </span>
              <span className="flex items-center block gap-1 text-xs font-medium">
                <Folder size={15} /> {childFolders} {childFolders > 1 ? "folders" : "folder"}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <form>
          <div className="mb-2"></div>

          <DialogFooter>
            <Button
              onClick={(e) => handleButtonClick(e, folderId)}
              className="inline-flex items-center justify-center w-full h-10 px-4 py-2 text-sm font-medium transition-colors rounded-md bg-destructive text-destructive-foreground ring-offset-background hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Confirm delete folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
