import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type PendingUploadDocument = {
  id: string; // Temporary ID for optimistic rendering
  name: string;
  folderId: string | null;
  uploadedAt: Date;
  status: "uploading" | "processing" | "complete" | "error";
  progress: number;
  documentId?: string; // Real document ID after API response
  dataroomDocumentId?: string; // Real dataroom document ID after API response
  fileType?: string;
  errorMessage?: string;
};

export type PendingUploadsContextType = {
  pendingUploads: PendingUploadDocument[];
  addPendingUpload: (upload: PendingUploadDocument) => void;
  updatePendingUpload: (
    id: string,
    update: Partial<PendingUploadDocument>,
  ) => void;
  removePendingUpload: (id: string) => void;
  clearCompletedUploads: () => void;
  getPendingUploadsForFolder: (folderId: string | null) => PendingUploadDocument[];
};

export const initialState: PendingUploadsContextType = {
  pendingUploads: [],
  addPendingUpload: () => {},
  updatePendingUpload: () => {},
  removePendingUpload: () => {},
  clearCompletedUploads: () => {},
  getPendingUploadsForFolder: () => [],
};

const PendingUploadsContext =
  createContext<PendingUploadsContextType>(initialState);

export const PendingUploadsProvider = ({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element => {
  const [pendingUploads, setPendingUploads] = useState<PendingUploadDocument[]>(
    [],
  );

  const addPendingUpload = useCallback((upload: PendingUploadDocument) => {
    setPendingUploads((prev) => [...prev, upload]);
  }, []);

  const updatePendingUpload = useCallback(
    (id: string, update: Partial<PendingUploadDocument>) => {
      setPendingUploads((prev) =>
        prev.map((upload) =>
          upload.id === id ? { ...upload, ...update } : upload,
        ),
      );
    },
    [],
  );

  const removePendingUpload = useCallback((id: string) => {
    setPendingUploads((prev) => prev.filter((upload) => upload.id !== id));
  }, []);

  const clearCompletedUploads = useCallback(() => {
    setPendingUploads((prev) =>
      prev.filter((upload) => upload.status !== "complete"),
    );
  }, []);

  const getPendingUploadsForFolder = useCallback(
    (folderId: string | null) => {
      return pendingUploads.filter((upload) => upload.folderId === folderId);
    },
    [pendingUploads],
  );

  const value = useMemo(
    () => ({
      pendingUploads,
      addPendingUpload,
      updatePendingUpload,
      removePendingUpload,
      clearCompletedUploads,
      getPendingUploadsForFolder,
    }),
    [
      pendingUploads,
      addPendingUpload,
      updatePendingUpload,
      removePendingUpload,
      clearCompletedUploads,
      getPendingUploadsForFolder,
    ],
  );

  return (
    <PendingUploadsContext.Provider value={value}>
      {children}
    </PendingUploadsContext.Provider>
  );
};

export const usePendingUploads = () => useContext(PendingUploadsContext);
