import { useState } from "react";

import { CheckIcon, XIcon } from "lucide-react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import { cn } from "@/lib/utils";

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
        <DrawerContent className="inset-x-auto right-6 h-full w-1/5 min-w-[350px] shadow-md focus-visible:outline-none">
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
          <div
            className={cn(
              "mx-auto flex w-full max-w-md grow flex-col *:px-4 *:py-3",

              {
                "mb-[742px] overflow-y-auto": activeSnap === "250px",
                "overflow-hidden": activeSnap !== "250px",
              },
            )}
          >
            {uploads.map((upload, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-100 hover:dark:bg-gray-900"
              >
                <a
                  href={`/documents/${upload.documentId}`}
                  className="flex items-center justify-between"
                >
                  <span>{upload.fileName}</span>
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
                className="flex items-center justify-between p-2 text-destructive hover:bg-gray-100 hover:dark:bg-gray-900"
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
