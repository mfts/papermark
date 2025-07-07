import { CheckIcon, XIcon } from "lucide-react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import { Gauge } from "./ui/gauge";
import { RejectedFile, UploadState } from "./upload-zone";

interface UploadNotificationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploads: UploadState[];
  setUploads: (uploads: UploadState[]) => void;
  rejectedFiles: RejectedFile[];
  setRejectedFiles: (rejected: RejectedFile[]) => void;
  handleCloseDrawer: () => void;
}

export function UploadNotificationDrawer({
  open,
  onOpenChange,
  uploads,
  setUploads,
  rejectedFiles,
  setRejectedFiles,
  handleCloseDrawer,
}: UploadNotificationDrawerProps) {
  const uploadCount = uploads.length;
  const failedCount = rejectedFiles.length;

  const onOpenChangeHandler = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setUploads([]);
      setRejectedFiles([]);
    }
  };

  return (
    <div className="h-50 fixed bottom-0 right-20">
      <Drawer
        modal={false}
        open={open}
        onOpenChange={onOpenChangeHandler}
        dismissible={false}
      >
        <DrawerContent className="inset-x-auto right-6 max-h-[250px] w-1/5 min-w-[350px] max-w-[400px] shadow-md focus-visible:outline-none">
          <DrawerHeader className="flex h-10 items-center justify-between rounded-t-lg border-b border-transparent bg-gray-100 dark:bg-gray-900">
            <div className="flex items-center space-x-1">
              <DrawerTitle>{uploadCount} uploads</DrawerTitle>
              {failedCount > 0 ? (
                <p className="text-sm">
                  (
                  <span className="text-destructive">{failedCount} failed</span>
                  )
                </p>
              ) : null}
            </div>
            <DrawerClose
              className="rounded-full p-1 hover:bg-gray-200 hover:dark:bg-gray-800"
              onClick={handleCloseDrawer}
            >
              <XIcon className="h-6 w-6" />
            </DrawerClose>
          </DrawerHeader>
          <div className="mx-auto flex w-full flex-1 flex-col overflow-y-auto">
            {uploads.map((upload, index) => (
              <div
                key={index}
                className="px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                {upload.progress === 100 && upload.documentId ? (
                  <a
                    href={`/documents/${upload.documentId}`}
                    className="flex items-center justify-between group"
                  >
                    <span className="w-72 truncate text-sm">{upload.fileName}</span>
                    <CheckIcon
                      className="h-6 w-6 rounded-full bg-emerald-500 p-1 text-background"
                      strokeWidth={3}
                    />
                  </a>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="w-72 truncate text-sm text-gray-500 dark:text-gray-400">{upload.fileName}</span>
                    <Gauge
                      value={upload.progress}
                      size={"xs"}
                      showValue={true}
                    />
                  </div>
                )}
              </div>
            ))}
            {rejectedFiles.map((rejected, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <span className="w-72 truncate">{rejected.fileName}</span>
                <span className="text-xs">{rejected.message}</span>
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
