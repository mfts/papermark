import { useState } from "react";

import { toast } from "sonner";

interface UseFolderDownloadProps {
  teamId: string | undefined;
  dataroomId?: string;
  isDataroom?: boolean;
  onDownloadComplete?: () => void;
}

export const useFolderDownload = ({
  teamId,
  dataroomId,
  isDataroom,
  onDownloadComplete,
}: UseFolderDownloadProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const downloadFolders = async (folderIds: string[], folderName?: string) => {
    if (!folderIds || folderIds.length === 0) {
      toast.error("No folders selected");
      return;
    }

    setIsLoading(true);
    const endpoint = isDataroom
      ? `/api/teams/${teamId}/datarooms/${dataroomId}/download/folder`
      : `/api/teams/${teamId}/documents/download/folder`;

    try {
      const toastMessage = folderName
        ? `Downloading ${folderName} folder...`
        : `Downloading ${folderIds.length} folder${folderIds.length > 1 ? "s" : ""}...`;

      await toast.promise(
        fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ folderIds }),
        }).then(async (response) => {
          if (!response.ok) {
            throw new Error(
              `Failed to download folder(s): ${folderIds.join(", ")}`,
            );
          }

          const { downloadUrl } = await response.json();
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.rel = "noopener noreferrer";
          document.body.appendChild(link);
          link.click();

          setTimeout(() => {
            document.body.removeChild(link);
          }, 100);
        }),
        {
          loading: toastMessage,
          success: "Download successfully.",
          error: "Failed to download folders. Please try again.",
        },
      );
    } catch (error) {
      console.error("Error during folder download:", error);
      toast.error("Something went wrong.");
      setIsLoading(false);
      onDownloadComplete?.();
    } finally {
      setIsLoading(false);
      onDownloadComplete?.();
    }
  };

  return { isLoading, downloadFolders };
};
