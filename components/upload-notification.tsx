import { useState } from "react";

import { XIcon } from "lucide-react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import { cn } from "@/lib/utils";

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
  uploads: { fileName: string; progress: number }[];
  setUploads: (uploads: { fileName: string; progress: number }[]) => void;
  rejectedFiles: { fileName: string; message: string }[];
  setRejectedFiles: (rejected: { fileName: string; message: string }[]) => void;
}) {
  const uploadCount = uploads.length;
  const failedCount = rejectedFiles.length;
  const [activeSnap, setActiveSnap] = useState<number | string | null>("250px");

  const onOpenChangeHandler = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setUploads([]);
      setRejectedFiles([]);
    } else {
      setActiveSnap("250px");
    }
  };

  return (
    <div className="h-50 fixed bottom-0 right-20">
      <Drawer
        modal={false}
        open={open}
        onOpenChange={onOpenChangeHandler}
        snapPoints={["40px", "250px"]}
        activeSnapPoint={activeSnap}
        setActiveSnapPoint={setActiveSnap}
      >
        <DrawerContent className="inset-x-auto right-6 h-full w-1/5 min-w-[350px] shadow-md">
          <DrawerHeader className="flex h-10 items-center justify-between rounded-t-lg border-b border-transparent bg-gray-100">
            <div className="flex items-center space-x-1">
              <DrawerTitle>{uploadCount} uploads</DrawerTitle>
              {failedCount > 0 ? (
                <p className="text-sm">
                  (<span className="text-red-600">{failedCount} failed</span>)
                </p>
              ) : null}
            </div>
            <DrawerClose className="rounded-full p-1 hover:bg-gray-200">
              <XIcon className="h-6 w-6" />
            </DrawerClose>
          </DrawerHeader>
          <div
            className={cn(
              "mx-auto flex w-full max-w-md grow flex-col divide-y *:px-4 *:py-3",
              {
                "mb-[742px] overflow-y-auto": activeSnap === "250px",
                "overflow-hidden": activeSnap !== "250px",
              },
            )}
          >
            {uploads.map((upload, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2"
              >
                <span>{upload.fileName}</span>
                <span>{upload.progress}%</span>
              </div>
            ))}
            {rejectedFiles.map((rejected, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 text-red-600"
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
