import React, { createContext, useContext, useEffect, useState } from "react";

import {
  UploadProgress,
  useGoogleDriveUpload,
} from "@/lib/hooks/use-google-drive-upload";

import {
  Files,
  ProcessedFile,
} from "@/components/documents/add-document-modal";

type UploadContextType = {
  uploads: UploadProgress[];
  isUploading: boolean;
  startUpload: (params: {
    treeFiles: ProcessedFile;
    path?: string;
    dataroomId?: string;
    filesList: Files[];
    teamId: string;
  }) => Promise<() => void>;
};

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const { uploads, isUploading, startUpload } = useGoogleDriveUpload();

  // Force re-render when uploads change
  const [uploadState, setUploadState] = useState<UploadProgress[]>([]);

  useEffect(() => {
    // Update local state when uploads change
    setUploadState(uploads);

    // TODO : REMOVE THIS
    if (uploads.length > 0) {
      console.debug("Upload state updated:", {
        count: uploads.length,
        statuses: uploads.map((u) => ({
          id: u.fileId,
          status: u.status,
          progress: u.progress,
        })),
      });
    }
  }, [uploads]);

  return (
    <UploadContext.Provider
      value={{
        uploads: uploadState,
        isUploading,
        startUpload,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
}
