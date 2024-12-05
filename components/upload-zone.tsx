import { useRouter } from "next/router";

import { useCallback, useRef, useState } from "react";

import { useTeam } from "@/context/team-context";
import { DocumentStorageType } from "@prisma/client";
import { useSession } from "next-auth/react";
import { DropEvent, FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { mutate } from "swr";

import { useAnalytics } from "@/lib/analytics";
import { SUPPORTED_DOCUMENT_MIME_TYPES } from "@/lib/constants";
import { DocumentData, createDocument } from "@/lib/documents/create-document";
import { resumableUpload } from "@/lib/files/tus-upload";
import { usePlan } from "@/lib/swr/use-billing";
import useLimits from "@/lib/swr/use-limits";
import { CustomUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getSupportedContentType } from "@/lib/utils/get-content-type";
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
};

interface FileWithPaths extends File {
  path?: string;
  whereToUploadPath?: string;
}

const fileSizeLimits: { [key: string]: number } = {
  "application/vnd.ms-excel": 40, // 40 MB
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": 40, // 40 MB
  "application/vnd.oasis.opendocument.spreadsheet": 40, // 40 MB
  "image/png": 100, // 100 MB
  "image/jpeg": 100, // 100 MB
  "image/jpg": 100, // 100 MB
};

export default function UploadZone({
  children,
  onUploadStart,
  onUploadProgress,
  onUploadRejected,
  folderPathName,
  setUploads,
  setRejectedFiles,
  dataroomId,
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
  folderPathName?: string;
  dataroomId?: string;
}) {
  const analytics = useAnalytics();
  const { plan, trial } = usePlan();
  const router = useRouter();
  const teamInfo = useTeam();
  const { data: session } = useSession();
  const isFreePlan = plan === "free";
  const isTrial = !!trial;
  const maxSize = isFreePlan && !isTrial ? 30 : 350;
  const maxNumPages = isFreePlan && !isTrial ? 100 : 500;
  const { limits, canAddDocuments } = useLimits();
  const remainingDocuments = limits?.documents
    ? limits?.documents - limits?.usage?.documents
    : 0;

  const [progress, setProgress] = useState<number>(0);
  const [showProgress, setShowProgress] = useState(false);
  const uploadProgress = useRef<number[]>([]);

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
          message = `File size too big (max. ${maxSize} MB). Upgrade to a paid plan to increase the limit.`;
        } else if (errors.find(({ code }) => code === "file-invalid-type")) {
          const isSupported = SUPPORTED_DOCUMENT_MIME_TYPES.includes(file.type);
          message = `File type not supported ${
            isFreePlan && !isTrial && isSupported ? `on free plan` : ""
          }`;
        }
        return { fileName: file.name, message };
      });
      onUploadRejected(rejected);
    },
    [onUploadRejected, maxSize],
  );

  const onDrop = useCallback(
    (acceptedFiles: FileWithPaths[]) => {
      if (!canAddDocuments && acceptedFiles.length > remainingDocuments) {
        toast.error("You have reached the maximum number of documents.");
        return;
      }
      const newUploads = acceptedFiles.map((file) => ({
        fileName: file.name,
        progress: 0,
      }));
      onUploadStart(newUploads);

      const uploadPromises = acceptedFiles.map(async (file, index) => {
        // Due to `getFilesFromEvent` file.path will always hold a valid value and represents the value of webkitRelativePath.
        // We no longer need to use webkitRelativePath because everything is been handled in `getFilesFromEvent`
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

        // check dynamic file size
        const fileType = file.type;
        const fileSizeLimit = fileSizeLimits[fileType] * 1024 * 1024;
        if (file.size > fileSizeLimit) {
          setUploads((prev) =>
            prev.filter((upload) => upload.fileName !== file.name),
          );

          return setRejectedFiles((prev) => [
            {
              fileName: file.name,
              message: `File size too big (max. ${fileSizeLimit} MB)`,
            },
            ...prev,
          ]);
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
          ownerId: (session?.user as CustomUser).id,
          teamId: teamInfo?.currentTeam?.id as string,
          numPages,
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

        const documentData: DocumentData = {
          key: uploadResult.id,
          supportedFileType: supportedFileType,
          name: file.name,
          storageType: DocumentStorageType.S3_PATH,
          contentType: contentType,
          fileSize: file.size,
        };

        const fileUploadPathName = file?.whereToUploadPath;

        const response = await createDocument({
          documentData,
          teamId: teamInfo?.currentTeam?.id as string,
          numPages: uploadResult.numPages,
          folderPathName: fileUploadPathName,
        });

        // add the new document to the list
        mutate(`/api/teams/${teamInfo?.currentTeam?.id}/documents`);
        fileUploadPathName &&
          mutate(
            `/api/teams/${teamInfo?.currentTeam?.id}/folders/documents/${fileUploadPathName}`,
          );

        const document = await response.json();

        if (dataroomId) {
          try {
            const response = await fetch(
              `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/documents`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  documentId: document.id,
                  folderPathName: fileUploadPathName,
                }),
              },
            );

            if (!response.ok) {
              const { message } = await response.json();
              console.error(
                "An error occurred while adding document to the dataroom: ",
                message,
              );
              return;
            }

            mutate(
              `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/documents`,
            );
            fileUploadPathName &&
              mutate(
                `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/folders/documents/${fileUploadPathName}`,
              );
          } catch (error) {
            console.error(
              "An error occurred while adding document to the dataroom: ",
              error,
            );
          }
        }

        // update progress to 100%
        onUploadProgress(index, 100, document.id);

        analytics.capture("Document Added", {
          documentId: document.id,
          name: document.name,
          numPages: document.numPages,
          path: router.asPath,
          type: document.type,
          contentType: document.contentType,
          teamId: teamInfo?.currentTeam?.id,
          bulkupload: true,
          dataroomId: dataroomId,
        });

        return document;
      });

      const documents = Promise.all(uploadPromises).finally(() => {
        /* If it a parentFolder was created prior to the upload, we would need to update that
           how many documents and folders does this folder contain rather than displaying 0
            */

        mutate(
          `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}?root=true`,
        );
        mutate(`/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}`);
        folderPathName &&
          mutate(
            `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}/${folderPathName}`,
          );
      });
    },
    [onUploadStart, onUploadProgress, endpointTargetType],
  );

  const getFilesFromEvent = useCallback(
    async (event: DropEvent) => {
      // This callback also run when event.type =`dragenter`. We only need to compute files when the event.type is `drop`.
      if (event.type !== "drop" && event.type !== "change") {
        return [];
      }

      let filesToBePassedToOnDrop: FileWithPaths[] = [];

      /** *********** START OF `traverseFolder` *********** */
      const traverseFolder = async (
        entry: FileSystemEntry,
        parentPathOfThisEntry?: string,
      ): Promise<FileWithPaths[]> => {
        /**
         * Summary of this function:
         *  1. if it find a folder then corresponding folder will be created at backend.
         *  2. Smoothly handles the deeply nested folders.
         *  3. Upon folder creation it assign the path and whereToUploadPath to each entry. (Those values will be helpful for `onDrop` to  upload document correctly)
         */

        let files: FileWithPaths[] = [];

        if (entry.isDirectory) {
          /**
           * Let's create the folder.
           * Fact that reader can skip: For Consistency, child files will only be pushed if folder successfully gets created.
           */
          try {
            // An empty folder name can cause the unexpected url problems.
            if (entry.name.trim() === "") {
              setRejectedFiles((prev) => [
                {
                  fileName: entry.name,
                  message: "Folder name cannot be empty",
                },
                ...prev,
              ]);
              throw new Error("Folder name cannot be empty");
            }

            if (!teamInfo?.currentTeam?.id) {
              /** This case probably may not happen */
              setRejectedFiles((prev) => [
                {
                  fileName: "Unknown Team",
                  message: "Team Id not found",
                },
                ...prev,
              ]);
              throw new Error("No team found");
            }

            const response = await fetch(
              `/api/teams/${teamInfo.currentTeam.id}/${endpointTargetType}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  name: entry.name, // as folderName
                  path: parentPathOfThisEntry ?? folderPathName,
                }),
              },
            );

            if (!response.ok) {
              const { message } = await response.json();
              setRejectedFiles((prev) => [
                {
                  fileName: entry.name,
                  message: message,
                },
                ...prev,
              ]);
            } else {
              let {
                parentFolderPath: parentFolderPath,
                path: slugifiedPathNameOfThisEntryAfterFolderCreation,
              } = await response.json();

              if (
                slugifiedPathNameOfThisEntryAfterFolderCreation?.startsWith("/")
              ) {
                // Reason "/" is removed because our `createDocument` API needs `path` to not start with "/"
                slugifiedPathNameOfThisEntryAfterFolderCreation =
                  slugifiedPathNameOfThisEntryAfterFolderCreation.slice(1);
              }

              analytics.capture("Folder Added", { folderName: entry.name });
              mutate(
                `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}?root=true`,
              );
              mutate(
                `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}`,
              );
              mutate(
                `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}${parentFolderPath}`,
              );

              // Now we are sure that folder is created at the backend and we can continue to traverse its child folders/files.
              const dirReader = (
                entry as FileSystemDirectoryEntry
              ).createReader();
              const subEntries = await new Promise<FileSystemEntry[]>(
                (resolve) => dirReader.readEntries(resolve),
              );

              for (const subEntry of subEntries) {
                files.push(
                  ...(await traverseFolder(
                    subEntry,
                    slugifiedPathNameOfThisEntryAfterFolderCreation,
                  )),
                );
              }
            }
          } catch (error) {
            setRejectedFiles((prev) => [
              {
                fileName: entry.name,
                message: "Failed to create the folder",
              },
              ...prev,
            ]);
          }
        } else if (entry.isFile) {
          let file = await new Promise<FileWithPaths>((resolve) =>
            (entry as FileSystemFileEntry).file(resolve),
          );

          /** In some browsers e.g firefox is not able to detect the file type. (This only happens when user upload folder) */
          const browserFileTypeCompatibilityIssue = file.type === "";

          if (browserFileTypeCompatibilityIssue) {
            const fileExtension = file.name.split(".").pop();
            const correctFileType =
              fileExtension &&
              Object.keys(acceptableDropZoneFileTypes).find((fileType) =>
                fileType.endsWith(fileExtension),
              );

            if (correctFileType) {
              // if we can't do like ```file.type = fileType``` because of [Error: Setting getter-only property "type"]
              // The following is the only best way to resolve the problem
              file = new File([file], file.name, {
                type: correctFileType,
                lastModified: file.lastModified,
              });
            }
          }

          // Reason of removing "/" because webkitRelativePath doesn't start with "/"
          file.path = entry.fullPath.startsWith("/")
            ? entry.fullPath.substring(1)
            : entry.fullPath;

          file.whereToUploadPath = parentPathOfThisEntry ?? folderPathName;

          files.push(file);
        }

        return files;
      };
      /** *********** END OF `traverseFolder` *********** */

      if ("dataTransfer" in event && event.dataTransfer) {
        const items = event.dataTransfer.items;

        const fileResults = await Promise.all(
          Array.from(items, (item) => {
            // MDN Note: This function is implemented as webkitGetAsEntry() in non-WebKit browsers including Firefox at this time; it may be renamed to getAsEntry() in the future, so you should code defensively, looking for both.
            const entry =
              (typeof item?.webkitGetAsEntry === "function" &&
                item.webkitGetAsEntry()) ??
              (typeof (item as any)?.getAsEntry === "function" &&
                (item as any).getAsEntry()) ??
              null;
            return entry ? traverseFolder(entry) : [];
          }),
        );
        fileResults.forEach((fileResult) =>
          filesToBePassedToOnDrop.push(...fileResult),
        );
      } else if (
        event.target &&
        event.target instanceof HTMLInputElement &&
        event.target.files
      ) {
        for (let i = 0; i < event.target.files.length; i++) {
          const file: FileWithPaths = event.target.files[i];
          file.path = file.name;
          file.whereToUploadPath = folderPathName;
          filesToBePassedToOnDrop.push(event.target.files[i]);
        }
      }

      return filesToBePassedToOnDrop;
    },
    [folderPathName, endpointTargetType, teamInfo],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: acceptableDropZoneFileTypes,
    multiple: true,
    maxSize: maxSize * 1024 * 1024, // 30 MB
    onDrop,
    onDropRejected,
    getFilesFromEvent,
  });

  return (
    <div
      {...getRootProps({ onClick: (evt) => evt.stopPropagation() })}
      className="relative h-full min-h-[calc(100vh-350px)]"
    >
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 top-0 z-50",
          isDragActive ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "-m-1 hidden h-full items-center justify-center border-dashed bg-gray-100 text-center dark:border-gray-300 dark:bg-gray-400",
            isDragActive && "flex",
          )}
        >
          <input
            {...getInputProps()}
            name="file"
            id="upload-multi-files-zone"
            className="sr-only"
          />

          <div className="mt-4 flex flex-col text-sm leading-6 text-gray-800">
            <span className="mx-auto">Drop your file(s) to upload here</span>
            <p className="text-xs leading-5 text-gray-800">
              {isFreePlan && !isTrial
                ? `Only *.pdf, *.xls, *.xlsx, *.csv, *.ods, *.png, *.jpeg, *.jpg & ${maxSize} MB limit`
                : `Only *.pdf, *.pptx, *.docx, *.xlsx, *.xls, *.csv, *.ods, *.ppt, *.odp, *.doc, *.odt, *.dwg, *.dxf, *.png, *.jpg, *.jpeg & ${maxSize} MB limit`}
            </p>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
