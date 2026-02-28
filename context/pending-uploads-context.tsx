import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type PendingUploadDocument = {
  id: string;
  name: string;
  folderId: string | null;
  uploadedAt: Date;
  status: "uploading" | "processing" | "complete" | "error";
  progress: number;
  documentId?: string;
  dataroomDocumentId?: string;
  /** Version ID used to subscribe to Trigger.dev realtime processing updates */
  documentVersionId?: string;
  fileType?: string;
  errorMessage?: string;
  /** Whether this upload was loaded from the server (persisted) */
  persisted?: boolean;
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
  getPendingUploadsForFolder: (
    folderId: string | null,
  ) => PendingUploadDocument[];
  /** Returns all uploads (in-flight + persisted) */
  getAllUploads: () => PendingUploadDocument[];
  /** Whether the visitor has any uploads */
  hasUploads: boolean;
  /** Whether persisted uploads are still loading */
  isLoading: boolean;
};

export const initialState: PendingUploadsContextType = {
  pendingUploads: [],
  addPendingUpload: () => {},
  updatePendingUpload: () => {},
  removePendingUpload: () => {},
  clearCompletedUploads: () => {},
  getPendingUploadsForFolder: () => [],
  getAllUploads: () => [],
  hasUploads: false,
  isLoading: false,
};

const PendingUploadsContext =
  createContext<PendingUploadsContextType>(initialState);

export const PendingUploadsProvider = ({
  children,
  linkId,
  dataroomId,
}: {
  children: React.ReactNode;
  linkId?: string;
  dataroomId?: string;
}): JSX.Element => {
  // In-flight uploads from the current session (uploading, processing, etc.)
  const [pendingUploads, setPendingUploads] = useState<
    PendingUploadDocument[]
  >([]);
  // Persisted uploads loaded from the server
  const [persistedUploads, setPersistedUploads] = useState<
    PendingUploadDocument[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchedRef = useRef(false);

  // Fetch the viewer's persisted uploads on mount
  useEffect(() => {
    if (!linkId || !dataroomId || fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchUploads = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/links/${linkId}/upload?dataroomId=${dataroomId}`,
        );
        if (!res.ok) return;

        const data = await res.json();
        if (data.uploads && Array.isArray(data.uploads)) {
          const loaded: PendingUploadDocument[] = data.uploads.map(
            (u: any) => ({
              id: u.id,
              name: u.name,
              folderId: u.folderId,
              uploadedAt: new Date(u.uploadedAt),
              status: u.status as "complete" | "processing",
              progress: 100,
              documentId: u.documentId,
              dataroomDocumentId: u.dataroomDocumentId,
              documentVersionId: u.documentVersionId ?? undefined,
              fileType: u.fileType,
              persisted: true,
            }),
          );
          setPersistedUploads(loaded);
        }
      } catch (err) {
        console.error("Failed to fetch viewer uploads:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUploads();
  }, [linkId, dataroomId]);

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
      setPersistedUploads((prev) =>
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

  // Merge in-flight and persisted uploads, deduplicating by documentId
  const allUploads = useMemo(() => {
    // In-flight uploads take priority (they have real-time status)
    const inFlightDocIds = new Set(
      pendingUploads
        .filter((u) => u.documentId)
        .map((u) => u.documentId),
    );

    // Filter out persisted uploads that already have an in-flight version
    const filteredPersisted = persistedUploads.filter(
      (u) => !inFlightDocIds.has(u.documentId),
    );

    return [...pendingUploads, ...filteredPersisted];
  }, [pendingUploads, persistedUploads]);

  const getPendingUploadsForFolder = useCallback(
    (folderId: string | null) => {
      return allUploads.filter((upload) => upload.folderId === folderId);
    },
    [allUploads],
  );

  const getAllUploads = useCallback(() => {
    return allUploads;
  }, [allUploads]);

  const hasUploads = allUploads.length > 0;

  const value = useMemo(
    () => ({
      pendingUploads: allUploads,
      addPendingUpload,
      updatePendingUpload,
      removePendingUpload,
      clearCompletedUploads,
      getPendingUploadsForFolder,
      getAllUploads,
      hasUploads,
      isLoading,
    }),
    [
      allUploads,
      addPendingUpload,
      updatePendingUpload,
      removePendingUpload,
      clearCompletedUploads,
      getPendingUploadsForFolder,
      getAllUploads,
      hasUploads,
      isLoading,
    ],
  );

  return (
    <PendingUploadsContext.Provider value={value}>
      {children}
    </PendingUploadsContext.Provider>
  );
};

export const usePendingUploads = () => useContext(PendingUploadsContext);
