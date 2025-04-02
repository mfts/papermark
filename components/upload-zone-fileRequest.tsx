import { useRouter } from "next/router";

import { useCallback, useMemo, useRef, useState } from "react";
import { LimitProps } from "@/ee/limits/swr-handler";
import { Document, DocumentStorageType } from "@prisma/client";
import { FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { useAnalytics } from "@/lib/analytics";
import { DocumentData, createDocument } from "@/lib/documents/create-document";
import { resumableUpload } from "@/lib/files/tus-upload";
import { LinkWithRequestFile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getSupportedContentType } from "@/lib/utils/get-content-type";
import {
  getFileSizeLimit,
  getFileSizeLimits,
} from "@/lib/utils/get-file-size-limits";
import { getPagesCount } from "@/lib/utils/get-page-number-count";

// Originally these mime values were directly used in the dropzone hook.
// There was a solid reason to take them out of the scope, primarily to solve a browser compatibility issue to determine the file type when user dropped a folder.
// you will figure out how this change helped to fix the compatibility issue once you have went through reading of `getFilesFromDropEvent` and `traverseFolder`
const acceptableDropZoneMimeTypesWhenIsFreePlanAndNotTrail = {
  "application/pdf": [], // ".pdf"
  "application/vnd.ms-excel": [], // ".xls"
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [], // ".xlsx"
  "text/csv": [], // ".csv"
  "application/vnd.oasis.opendocument.spreadsheet": [], // ".ods"
  "image/png": [], // ".png"
  "image/jpeg": [], // ".jpeg"
  "image/jpg": [], // ".jpg"
};
const allAcceptableDropZoneMimeTypes = {
  "application/pdf": [], // ".pdf"
  "application/vnd.ms-excel": [], // ".xls"
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [], // ".xlsx"
  "application/vnd.ms-excel.sheet.macroEnabled.12": [".xlsm"], // ".xlsm"
  "text/csv": [], // ".csv"
  "application/vnd.oasis.opendocument.spreadsheet": [], // ".ods"
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [], // ".docx"
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    [], // ".pptx"
  "application/vnd.ms-powerpoint": [], // ".ppt"
  "application/msword": [], // ".doc"
  "application/vnd.oasis.opendocument.text": [], // ".odt"
  "application/vnd.oasis.opendocument.presentation": [], // ".odp"
  "image/vnd.dwg": [".dwg"], // ".dwg"
  "image/vnd.dxf": [".dxf"], // ".dxf"
  "image/png": [], // ".png"
  "image/jpeg": [], // ".jpeg"
  "image/jpg": [], // ".jpg"
  "application/zip": [], // ".zip"
  "application/x-zip-compressed": [], // ".zip"
  "video/mp4": [], // ".mp4"
  "video/webm": [], // ".webm"
  "video/quicktime": [], // ".mov"
  "video/x-msvideo": [], // ".avi"
  "video/ogg": [], // ".ogg"
  "application/vnd.google-earth.kml+xml": [".kml"], // ".kml"
  "application/vnd.google-earth.kmz": [".kmz"], // ".kmz"
};

interface FileWithPaths extends File {
  path?: string;
  whereToUploadPath?: string;
}

export default function UploadZoneFileRequest({
  children,
  onUploadStart,
  onUploadProgress,
  onUploadRejected,
  folderPathName,
  setUploads,
  setRejectedFiles,
  dataroomId,
  wrapperClassName,
  teamPlan,
  isTeamTrial,
  teamId,
  remainingFileLength,
  limits,
  link,
  viewerId,
  onUploadSuccess,
  viewId,
}: {
  children: React.ReactNode;
  onUploadStart: (
    uploads: { fileName: string; progress: number; documentId?: string }[],
  ) => void;
  onUploadProgress: (
    index: number,
    progress: number,
    documentId?: string,
  ) => void;
  onUploadRejected: (rejected: { fileName: string; message: string }[]) => void;
  setUploads: React.Dispatch<
    React.SetStateAction<
      { fileName: string; progress: number; documentId?: string }[]
    >
  >;
  setRejectedFiles: React.Dispatch<
    React.SetStateAction<{ fileName: string; message: string }[]>
  >;
  onUploadSuccess: (document: Document[]) => void;
  folderPathName?: string[];
  dataroomId?: string;
  wrapperClassName?: string;
  teamPlan: string;
  isTeamTrial: boolean;
  teamId: string;
  viewerId: string;
  remainingFileLength: number;
  limits: LimitProps | null;
  link: LinkWithRequestFile;
  viewId?: string;
}) {
  const analytics = useAnalytics();
  const router = useRouter();
  const isFreePlan = teamPlan === "free";
  const isTrial = !!isTeamTrial;
  const maxNumPages = isFreePlan && !isTrial ? 100 : 500;

  const [progress, setProgress] = useState<number>(0);
  const [showProgress, setShowProgress] = useState(false);
  const uploadProgress = useRef<number[]>([]);

  const fileSizeLimits = useMemo(
    () =>
      getFileSizeLimits({
        limits,
        isFreePlan,
        isTrial,
      }),
    [limits, isFreePlan, isTrial],
  );

  const acceptableDropZoneFileTypes =
    isFreePlan && !isTrial
      ? acceptableDropZoneMimeTypesWhenIsFreePlanAndNotTrail
      : allAcceptableDropZoneMimeTypes;

  // this var will help to determine the correct api endpoint to request folder creation (If needed).
  const endpointTargetType = dataroomId
    ? `datarooms/${dataroomId}/folders`
    : "folders";

  const onDropRejected = useCallback(
    (rejectedFiles: FileRejection[]) => {
      const rejected = rejectedFiles.map(({ file, errors }) => {
        let message = "";
        if (errors.find(({ code }) => code === "file-too-large")) {
          const fileSizeLimitMB = getFileSizeLimit(file.type, fileSizeLimits);
          message = `File size too big (max. ${fileSizeLimitMB} MB).`;
        } else if (errors.find(({ code }) => code === "file-invalid-type")) {
          message = `File type not supported!`;
        }
        return { fileName: file.name, message };
      });
      onUploadRejected(rejected);
    },
    [onUploadRejected, fileSizeLimits, isFreePlan, isTrial],
  );

  const onDrop = useCallback(
    (acceptedFiles: FileWithPaths[]) => {
      if (
        remainingFileLength &&
        (remainingFileLength === 0 || remainingFileLength < acceptedFiles.length)
      ) {
        toast.error("You have reached the maximum number of documents.");
        return;
      }
      // Validate files and separate into valid and invalid
      const validatedFiles = acceptedFiles.reduce<{
        valid: FileWithPaths[];
        invalid: { fileName: string; message: string }[];
      }>(
        (acc, file) => {
          const fileSizeLimitMB = getFileSizeLimit(file.type, fileSizeLimits);
          const fileSizeLimit = fileSizeLimitMB * 1024 * 1024; // Convert to bytes

          if (file.size > fileSizeLimit) {
            acc.invalid.push({
              fileName: file.name,
              message: `File size too big (max. ${fileSizeLimitMB} MB)`,
            });
          } else {
            acc.valid.push(file);
          }
          return acc;
        },
        { valid: [], invalid: [] },
      );

      // Handle rejected files first
      if (validatedFiles.invalid.length > 0) {
        setRejectedFiles((prev) => [...validatedFiles.invalid, ...prev]);

        // If all files were rejected, show a summary toast
        if (validatedFiles.valid.length === 0) {
          toast.error(
            `${validatedFiles.invalid.length} file(s) exceeded size limits`,
          );
          return;
        }
      }

      // Continue with valid files
      const newUploads = validatedFiles.valid.map((file) => ({
        fileName: file.name,
        progress: 0,
      }));

      onUploadStart(newUploads);

      const uploadPromises = validatedFiles.valid.map(async (file, index) => {
        const path = file.path || file.name;

        // count the number of pages in the file
        let numPages = 1;
        if (file.type === "application/pdf") {
          const buffer = await file.arrayBuffer();
          numPages = await getPagesCount(buffer);

          if (numPages > maxNumPages) {
            setUploads((prev) =>
              prev.filter((upload) => upload.fileName !== file.name),
            );

            return setRejectedFiles((prev) => [
              {
                fileName: file.name,
                message: `File has too many pages (max. ${maxNumPages})`,
              },
              ...prev,
            ]);
          }
        }

        const { complete } = await resumableUpload({
          file, // File
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
            setUploads((prev) =>
              prev.filter((upload) => upload.fileName !== file.name),
            );

            setRejectedFiles((prev) => [
              { fileName: file.name, message: "Error uploading file" },
              ...prev,
            ]);
          },
          teamId: teamId,
          numPages,
          viewerId: viewerId,
          relativePath: path.substring(0, path.lastIndexOf("/")),
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
        };

        const response = await createDocument({
          documentData,
          teamId: teamId,
          numPages: uploadResult.numPages,
          folderPathName: folderPathName?.join("/"),
          createLink: false,
          viewerId: viewerId,
          approvalStatus: link.requireApproval ? "PENDING" : "APPROVED",
          uploadedViaLinkId: link.id,
          dataroomId: link.dataroomFolder?.dataroomId || undefined,
          viewId: viewId,
        });

        const document = await response.json();

        // update progress to 100%
        onUploadProgress(index, 100, document.id);

        analytics.capture("Document Added", {
          documentId: document.id,
          viewerId: viewerId,
          name: document.name,
          numPages: document.numPages,
          path: router.asPath,
          type: document.type,
          contentType: document.contentType,
          teamId: teamId,
          bulkupload: true,
          dataroomId: dataroomId,
          $set: {
            teamId: teamId,
            teamPlan: teamPlan,
          },
        });

        return document;
      });

      Promise.all(uploadPromises).then((data: Document[]) => {
        onUploadSuccess(data);
      }).finally(() => {
        setRejectedFiles([]);
        setProgress(0);
        setShowProgress(false);
        uploadProgress.current = [];
      });
    },
    [
      onUploadStart,
      onUploadProgress,
      endpointTargetType,
      fileSizeLimits,
      isFreePlan,
      isTrial,
    ],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: acceptableDropZoneFileTypes,
    multiple: true,
    maxFiles: fileSizeLimits.maxFiles ?? 150,
    onDrop,
    onDropRejected,
  });

  return (
    <div
      {...getRootProps({ onClick: (evt) => evt.stopPropagation() })}
      className={cn(
        "relative",
        dataroomId ? "min-h-[calc(100vh-350px)]" : "min-h-[calc(100vh-270px)]",
        wrapperClassName,
      )}
    >
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
          id="upload-multi-files-zone"
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
                  {isFreePlan && !isTrial
                    ? `Only *.pdf, *.xls, *.xlsx, *.csv, *.ods, *.png, *.jpeg, *.jpg`
                    : `Only *.pdf, *.pptx, *.docx, *.xlsx, *.xls, *.csv, *.ods, *.ppt, *.odp, *.doc, *.odt, *.dwg, *.dxf, *.png, *.jpg, *.jpeg, *.mp4, *.mov, *.avi, *.webm, *.ogg`}
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
