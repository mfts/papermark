import { AlertCircleIcon, DownloadIcon, FolderIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DownloadFolderConfirmationModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedFoldersLength: number;
  onDownload: () => void;
  isLoading: boolean;
}

export function DownloadFolderConfirmationModal({
  open,
  setOpen,
  selectedFoldersLength,
  onDownload,
  isLoading,
}: DownloadFolderConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download Folders</DialogTitle>
          <DialogDescription>
            Are you sure you want to download {selectedFoldersLength} folder
            {selectedFoldersLength > 1 ? "s" : ""}?
            <div className="flex flex-col items-center py-4">
              <div className="mb-2 flex items-center justify-center space-x-2">
                <AlertCircleIcon className="h-5 w-5 text-amber-500" />
                <span className="text-sm text-muted-foreground">
                  This will download all contents within the selected folders
                </span>
              </div>

              <div className="mt-2 w-full rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FolderIcon className="mr-2 h-5 w-5" />
                    <span className="font-medium">Selected Folders</span>
                  </div>
                  <Badge variant="default">{selectedFoldersLength}</Badge>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onDownload}
            disabled={isLoading || selectedFoldersLength === 0}
          >
            {isLoading ? (
              "Downloading..."
            ) : (
              <>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
