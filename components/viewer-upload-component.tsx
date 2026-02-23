import { useState } from "react";

import { toast } from "sonner";

import { DocumentData } from "@/lib/documents/create-document";

import ViewerUploadZone from "@/components/viewer-upload-zone";

export function ViewerUploadComponent({
  viewerData,
  teamId,
  folderId,
}: {
  viewerData: { id: string; linkId: string; dataroomId?: string };
  teamId: string;
  folderId?: string;
}) {
  const [uploads, setUploads] = useState<
    { fileName: string; progress: number }[]
  >([]);
  const [rejectedFiles, setRejectedFiles] = useState<
    { fileName: string; message: string }[]
  >([]);

  const handleUploadStart = (
    uploads: { fileName: string; progress: number }[],
  ) => {
    setUploads(uploads);
  };

  const handleUploadProgress = (index: number, progress: number) => {
    setUploads((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], progress };
      return updated;
    });
  };

  const handleUploadComplete = async (documentData: DocumentData) => {
    // Call your API to add the document to the dataroom or store it for viewer uploads
    try {
      const response = await fetch(`/api/links/${viewerData.linkId}/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentData,
          dataroomId: viewerData.dataroomId,
          folderId: folderId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process upload");
      }

      // Optional: You might want to update UI or fetch updated document list
    } catch (error) {
      console.error("Error processing upload:", error);
      toast.error((error as Error).message || "Failed to upload document");
    }
  };

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold">Upload Documents</h1>

      <ViewerUploadZone
        onUploadStart={handleUploadStart}
        onUploadProgress={handleUploadProgress}
        onUploadComplete={handleUploadComplete}
        onUploadRejected={(rejected) => setRejectedFiles(rejected)}
        viewerData={viewerData}
        teamId={teamId}
      >
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <p>Drag & drop files here, or click to select files</p>
          <p className="mt-2 text-sm text-gray-500">
            Supported file types: PDF, Word, Excel, CSV
          </p>

          {/* Display current uploads */}
          {uploads.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium">Uploads</h3>
              <ul className="mt-2 space-y-2">
                {uploads.map((upload, index) => (
                  <li key={index} className="text-sm">
                    {upload.fileName} - {upload.progress}%
                    <div className="mt-1 h-1 rounded-full bg-gray-200">
                      <div
                        className="h-1 rounded-full bg-blue-500"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Display rejected files */}
          {rejectedFiles.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-red-500">Rejected Files</h3>
              <ul className="mt-2 space-y-1">
                {rejectedFiles.map((file, index) => (
                  <li key={index} className="text-sm text-red-500">
                    {file.fileName}: {file.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ViewerUploadZone>
    </div>
  );
}
