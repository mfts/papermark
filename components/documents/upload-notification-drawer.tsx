import { useEffect, useState } from "react";

import { useUpload } from "@/lib/context/upload-context";

import { GoogleDriveUploadProgress } from "@/components/google-drive-upload-progress";

import { MinimizedUploadProgress } from "../minimized-upload-progress";

export function UploadNotificationDrawer() {
  const { uploads, isUploading } = useUpload();
  const [localUploads, setLocalUploads] = useState(uploads);
  const [open, setOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    setLocalUploads(uploads);
    if (uploads.length > 0) {
      setOpen(true);
    }
  }, [uploads]);

  if (!localUploads || localUploads.length === 0) {
    return null;
  }

  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (!isUploading) {
      setOpen(false);
      setLocalUploads([]);
    }
  };

  return (
    <>
      {isMinimized ? (
        <MinimizedUploadProgress
          uploads={localUploads}
          onMaximize={() => setIsMinimized(false)}
          onClose={handleClose}
          canClose={!isUploading}
        />
      ) : (
        <div className="fixed bottom-4 right-4 z-50 duration-300 animate-in fade-in slide-in-from-bottom-5">
          <GoogleDriveUploadProgress
            uploads={localUploads}
            open={open}
            setOpen={handleClose}
            setLocalUploads={setLocalUploads}
            onMinimize={() => setIsMinimized(true)}
            canClose={!isUploading}
          />
        </div>
      )}
    </>
  );
}
