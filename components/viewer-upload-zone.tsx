import { useCallback, useRef, useState } from "react";

import { DocumentStorageType } from "@prisma/client";
import { FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { VIEWER_ACCEPTED_FILE_TYPES } from "@/lib/constants";
import { DocumentData } from "@/lib/documents/create-document";
import { viewerUpload } from "@/lib/files/viewer-tus-upload";
import { cn } from "@/lib/utils";
import { getSupportedContentType } from "@/lib/utils/get-content-type";
import { getPagesCount } from "@/lib/utils/get-page-number-count";

// File types allowed for viewer uploads
const acceptableViewerFileTypes = VIEWER_ACCEPTED_FILE_TYPES;

export default function ViewerUploadZone({
  children,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadRejected,
  viewerData,
  teamId,
  maxFileSize = 30, // 30 MB default
}: {
  children: React.ReactNode;
  onUploadStart: (uploads: { fileName: string; progress: number }[]) => void;
  onUploadProgress: (index: number, progress: number) => void;
  onUploadComplete: (documentData: DocumentData) => void;
  onUploadRejected: (rejected: { fileName: string; message: string }[]) => void;
  viewerData: {
    id: string;
    linkId: string;
    dataroomId?: string;
  };
  teamId: string;
  maxFileSize?: number;
}) {
  const [progress, setProgress] = useState<number>(0);
  const uploadProgress = useRef<number[]>([]);

  const onDropRejected = useCallback(
    (rejectedFiles: FileRejection[]) => {
      const rejected = rejectedFiles.map(({ file, errors }) => {
        let message = "";
        if (errors.find(({ code }) => code === "file-too-large")) {
          message = `File size too big (max. ${maxFileSize} MB).`;
        } else if (errors.find(({ code }) => code === "file-invalid-type")) {
          message = `File type not supported. Please upload PDF, Word, or Excel files.`;
        }
        return { fileName: file.name, message };
      });
      onUploadRejected(rejected);
    },
    [onUploadRejected, maxFileSize],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newUploads = acceptedFiles.map((file) => ({
        fileName: file.name,
        progress: 0,
      }));

      onUploadStart(newUploads);

      const uploadPromises = acceptedFiles.map(async (file, index) => {
        // count the number of pages in the file
        let numPages = 1;
        if (file.type === "application/pdf") {
          const buffer = await file.arrayBuffer();
          numPages = await getPagesCount(buffer);
        }

        const { complete } = await viewerUpload({
          file,
          onProgress: (bytesUploaded, bytesTotal) => {
            uploadProgress.current[index] = (bytesUploaded / bytesTotal) * 100;
            onUploadProgress(
              index,
              Math.min(Math.round(uploadProgress.current[index]), 99),
            );

            const _progress = uploadProgress.current.reduce(
              (acc, progress) => acc + progress,
              0,
            );

            setProgress(Math.round(_progress / acceptedFiles.length));
          },
          onError: (error) => {
            console.error("Upload error:", error);
            toast.error(`Failed to upload ${file.name}`);
          },
          viewerData,
          teamId,
          numPages,
        });

        const uploadResult = await complete;

        let contentType = uploadResult.fileType;
        let supportedFileType = getSupportedContentType(contentType) ?? "";

        if (
          uploadResult.fileName.endsWith(".dwg") ||
          uploadResult.fileName.endsWith(".dxf")
        ) {
          supportedFileType = "cad";
          contentType = `image/vnd.${uploadResult.fileName.split(".").pop()}`;
        }

        if (uploadResult.fileName.endsWith(".xlsm")) {
          supportedFileType = "sheet";
          contentType = "application/vnd.ms-excel.sheet.macroEnabled.12";
        }

        if (
          uploadResult.fileName.endsWith(".kml") ||
          uploadResult.fileName.endsWith(".kmz")
        ) {
          supportedFileType = "map";
          contentType = `application/vnd.google-earth.${uploadResult.fileName.endsWith(".kml") ? "kml+xml" : "kmz"}`;
        }

        const documentData: DocumentData = {
          key: uploadResult.id,
          supportedFileType: supportedFileType,
          name: file.name,
          storageType: DocumentStorageType.S3_PATH,
          contentType: contentType,
          fileSize: file.size,
          numPages: numPages,
        };

        // Complete the upload by calling the provided callback
        onUploadComplete(documentData);

        onUploadProgress(index, 100); // Mark upload as complete

        return uploadResult;
      });

      try {
        await Promise.all(uploadPromises);
        toast.success("File upload complete!");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("An error occurred during upload");
      }
    },
    [onUploadStart, onUploadProgress, onUploadComplete, viewerData, teamId],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: acceptableViewerFileTypes,
    multiple: true,
    maxSize: maxFileSize * 1024 * 1024,
    onDrop,
    onDropRejected,
  });

  return (
    <div {...getRootProps()} className="relative min-h-[200px]">
      <div
        className={cn(
          "absolute inset-0 z-40 -m-1 rounded-lg border-2 border-dashed",
          isDragActive
            ? "pointer-events-auto border-primary/50 bg-gray-100/75 backdrop-blur-sm dark:bg-gray-800/75"
            : "pointer-events-none border-none",
        )}
      >
        <input
          {...getInputProps()}
          name="file"
          id="viewer-upload-files-zone"
          className="sr-only"
        />

        {isDragActive && (
          <div className="sticky top-1/2 z-50 -translate-y-1/2 px-2">
            <div className="flex justify-center">
              <div className="inline-flex flex-col rounded-lg bg-background/95 px-6 py-4 text-center ring-1 ring-gray-900/5 dark:bg-gray-900/95 dark:ring-white/10">
                <span className="font-medium text-foreground">
                  Drop your file(s) here
                </span>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Only *.pdf, *.doc, *.docx, *.xls, *.xlsx, *.csv, *.ods files
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
