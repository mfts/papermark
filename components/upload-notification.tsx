import { CheckIcon, XIcon } from "lucide-react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import { Gauge } from "./ui/gauge";

export function UploadNotificationDrawer({
  open,
  onOpenChange,
  uploads,
  setUploads,
  rejectedFiles,
  setRejectedFiles,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploads: { fileName: string; progress: number; documentId?: string }[];
  setUploads: (
    uploads: { fileName: string; progress: number; documentId?: string }[],
  ) => void;
  rejectedFiles: { fileName: string; message: string }[];
  setRejectedFiles: (rejected: { fileName: string; message: string }[]) => void;
}) {
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
            <DrawerClose className="rounded-full p-1 hover:bg-gray-200 hover:dark:bg-gray-800">
              <XIcon className="h-6 w-6" />
            </DrawerClose>
          </DrawerHeader>
          <div className="mx-auto flex w-full flex-1 flex-col overflow-y-auto">
            {uploads.map((upload, index) => (
              <div
                key={index}
                className="px-4 py-3 hover:bg-gray-100 hover:dark:bg-gray-900"
              >
                <a
                  href={`/documents/${upload.documentId}`}
                  className="flex items-center justify-between"
                >
                  <span className="w-72 truncate">{upload.fileName}</span>
                  {upload.progress === 100 ? (
                    <CheckIcon
                      className="h-6 w-6 rounded-full bg-emerald-500 p-1 text-background"
                      strokeWidth={3}
                    />
                  ) : (
                    <Gauge
                      value={upload.progress}
                      size={"xs"}
                      showValue={true}
                    />
                  )}
                </a>
              </div>
            ))}
            {rejectedFiles.map((rejected, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-3 text-destructive hover:bg-gray-100 hover:dark:bg-gray-900"
              >
                <span>{rejected.fileName}</span>
                <span>{rejected.message}</span>
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
