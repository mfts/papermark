import * as tus from "tus-js-client";

import { decodeBase64Url } from "../utils/decode-base64url";

type ViewerUploadParams = {
  file: File;
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
  onError?: (error: Error | tus.DetailedError) => void;
  viewerData: {
    id: string;
    linkId: string;
    dataroomId?: string;
  };
  teamId: string;
  numPages: number;
};

type UploadResult = {
  id: string;
  url: string;
  fileName: string;
  fileType: string;
  numPages: number;
  viewerId: string;
  linkId: string;
  dataroomId?: string;
  teamId: string;
};

export function viewerUpload({
  file,
  onProgress,
  onError,
  viewerData,
  teamId,
  numPages,
}: ViewerUploadParams) {
  return new Promise<{ upload: tus.Upload; complete: Promise<UploadResult> }>(
    (resolve, reject) => {
      let completeResolve: (
        value: UploadResult | PromiseLike<UploadResult>,
      ) => void;
      const complete = new Promise<UploadResult>((res) => {
        completeResolve = res;
      });

      const upload = new tus.Upload(file, {
        endpoint: `${process.env.NEXT_PUBLIC_BASE_URL}/api/file/tus-viewer`,
        retryDelays: [0, 3000, 5000, 10000],
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          fileName: file.name,
          contentType: file.type,
          numPages: String(numPages),
          teamId: teamId,
          viewerId: viewerData.id,
          linkId: viewerData.linkId,
          dataroomId: viewerData.dataroomId || "",
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
          // Do not retry if the status is a 500 or 403.
          if (status === 500 || status === 403) {
            return false;
          }
          // For any other status code, we retry.
          return true;
        },
        onProgress,
        onSuccess: () => {
          console.log("Uploaded successfully");
          const id = upload.url!.split("/api/file/tus-viewer/")[1];
          // if id contains a slash, then we use it as it otherwise we need to convert from buffer base64URL to utf-8
          const newId = id.includes("/") ? id : decodeBase64Url(id);
          completeResolve({
            id: newId,
            url: upload.url!,
            fileName: file.name,
            fileType: file.type,
            numPages,
            viewerId: viewerData.id,
            linkId: viewerData.linkId,
            dataroomId: viewerData.dataroomId,
            teamId,
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
