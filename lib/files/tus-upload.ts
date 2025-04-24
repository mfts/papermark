import * as tus from "tus-js-client";

import { decodeBase64Url } from "../utils/decode-base64url";

type ResumableUploadParams = {
  file: File | Buffer;
  fileName?: string;
  fileType?: string;
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
  onError?: (error: Error | tus.DetailedError) => void;
  ownerId: string;
  teamId: string;
  numPages: number;
  relativePath: string;
  googleDriveFileId?: string | null;
};

type UploadResult = {
  id: string;
  url: string;
  relativePath: string;
  fileName: string;
  fileType: string;
  numPages: number;
  ownerId: string;
  teamId: string;
  googleDriveFileId?: string | null; // Google Drive folder ID
};

export function resumableUpload({
  file,
  fileName,
  fileType,
  onProgress,
  onError,
  ownerId,
  teamId,
  numPages,
  relativePath,
  googleDriveFileId,
}: ResumableUploadParams) {
  return new Promise<{ upload: tus.Upload; complete: Promise<UploadResult> }>(
    (resolve, reject) => {
      let completeResolve: (
        value: UploadResult | PromiseLike<UploadResult>,
      ) => void;
      const complete = new Promise<UploadResult>((res) => {
        completeResolve = res;
      });
      const upload = new tus.Upload(file, {
        endpoint: `${process.env.NEXT_PUBLIC_BASE_URL}/api/file/tus`,
        retryDelays: [0, 3000, 5000, 10000],
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          fileName: fileName || (file instanceof File && file.name) || "unnamed-file",
          contentType: fileType || (file instanceof File && file.type) || "application/octet-stream", 
          numPages: String(numPages),
          teamId: teamId,
          ownerId: ownerId,
          relativePath: relativePath,
          googleDriveFileId: googleDriveFileId || "",
        },
        chunkSize: 4 * 1024 * 1024,
        onError: (error) => {
          onError && onError(error);
          console.error("Failed because: " + error);
          reject(error);
        },
        onShouldRetry(error, retryAttempt, options) {
          console.error(`Should retry upload. Attempt ${retryAttempt}`);
          var status = error.originalResponse
            ? error.originalResponse.getStatus()
            : 0;
          // Do not retry if the status is a 500.
          if (status === 500 || status === 403) {
            return false;
          }
          // For any other status code, we retry.
          return true;
        },
        onProgress,
        onSuccess: () => {
          console.log("Uploaded successfully");
          const id = upload.url!.split("/api/file/tus/")[1];
          // if id contains a slash, then we use it as it otherwise we need to convert from buffer base64URL to utf-8
          const newId = id.includes("/") ? id : decodeBase64Url(id);
          completeResolve({
            id: newId,
            url: upload.url!,
            relativePath,
            fileName: fileName || (file instanceof File && file.name) || "unnamed-file",
            fileType: fileType || (file instanceof File && file.type) || "application/octet-stream",
            numPages,
            ownerId,
            teamId,
            googleDriveFileId,
          });
        },
      });

      // Check if there are any previous uploads to continue.
      upload
        .findPreviousUploads()
        .then((previousUploads) => {
          // Found previous uploads so we select the first one.
          if (previousUploads.length) {
            upload.resumeFromPreviousUpload(previousUploads[0]);
          }

          upload.start();
          resolve({ upload, complete });
        })
        .catch((error) => {
          console.error("Error finding previous uploads:", error);
          upload.start();
          resolve({ upload, complete });
        });
    },
  );
}
