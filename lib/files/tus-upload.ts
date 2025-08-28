import * as tus from "tus-js-client";

import { decodeBase64Url } from "../utils/decode-base64url";

type ResumableUploadParams = {
  file: File;
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
  onError?: (error: Error | tus.DetailedError) => void;
  ownerId: string;
  teamId: string;
  numPages: number;
  relativePath: string;
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
};

export function resumableUpload({
  file,
  onProgress,
  onError,
  ownerId,
  teamId,
  numPages,
  relativePath,
}: ResumableUploadParams): Promise<{
  upload: tus.Upload;
  complete: Promise<UploadResult>;
}> {
  const retryDelays = [0, 3000, 5000, 10000, 15000, 20000];

  return new Promise((resolve, reject) => {
    let attempt = 0;
    let networkTimeoutId: NodeJS.Timeout | undefined;

    const createUpload = () => {
      console.log(`Starting upload attempt ${attempt + 1}/6`);

      let completeResolve: (
        value: UploadResult | PromiseLike<UploadResult>,
      ) => void;
      const complete = new Promise<UploadResult>((res) => {
        completeResolve = res;
      });

      let isTimedOut = false;

      const upload = new tus.Upload(file, {
        endpoint: `${process.env.NEXT_PUBLIC_BASE_URL}/api/file/tus`,
        retryDelays,
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          fileName: file.name,
          contentType: file.type,
          numPages: String(numPages),
          teamId: teamId,
          ownerId: ownerId,
          relativePath: relativePath,
        },
        chunkSize: 4 * 1024 * 1024,
        onError: (error) => {
          if (networkTimeoutId) clearTimeout(networkTimeoutId);
          console.error(`TUS onError called on attempt ${attempt + 1}:`, error);

          if (isTimedOut) {
            console.log(
              "Error was caused by our manual timeout, handling retry...",
            );
            return; // Let the timeout handler deal with retries
          }

          // Check if we should retry this error
          const shouldRetry = attempt < retryDelays.length - 1;
          const detailedError = error as tus.DetailedError;
          const isRetryableError =
            !detailedError.originalResponse || // Network error
            error.message?.toLowerCase().includes("timeout") ||
            error.message?.toLowerCase().includes("network") ||
            error.message?.toLowerCase().includes("err_timed_out") ||
            [0, 502, 503, 504].includes(
              detailedError.originalResponse?.getStatus() || 0,
            );

          if (shouldRetry && isRetryableError) {
            attempt++;
            const delay = retryDelays[attempt] || 10000;
            console.log(
              `Retrying upload in ${delay}ms (attempt ${attempt + 1}/${retryDelays.length})`,
            );

            setTimeout(() => {
              const newUpload = createUpload();
              resolve(newUpload);
            }, delay);
            return;
          }

          // No more retries or non-retryable error
          console.error("Upload failed after all retries:", error);
          onError?.(error);
          reject(error);
        },
        onShouldRetry(error, retryAttempt, options) {
          // We see this message, great! TUS internal retry system is working
          console.error(
            `TUS onShouldRetry called - Attempt ${retryAttempt}, Error:`,
            error,
          );

          // Let TUS handle these retries first, then we'll handle network timeouts separately
          return true;
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          // Reset timeout on any progress
          if (networkTimeoutId) clearTimeout(networkTimeoutId);

          // Set a new timeout
          networkTimeoutId = setTimeout(() => {
            console.error(
              `Network timeout after ${60_000}ms of no progress (attempt ${attempt + 1})`,
            );
            isTimedOut = true;
            upload.abort();

            // Handle retry after timeout
            const shouldRetry = attempt < retryDelays.length - 1;
            if (shouldRetry) {
              attempt++;
              const delay = retryDelays[attempt] || 10000;
              console.log(
                `Retrying after network timeout in ${delay}ms (attempt ${attempt + 1}/${retryDelays.length})`,
              );

              setTimeout(() => {
                const newUpload = createUpload();
                resolve(newUpload);
              }, delay);
            } else {
              console.error(
                "Upload failed after network timeout with no retries left",
              );
              onError?.(new Error("Network timeout after 60000ms"));
              reject(new Error("Network timeout after 60000ms"));
            }
          }, 60_000);

          onProgress?.(bytesUploaded, bytesTotal);
        },
        onSuccess: () => {
          if (networkTimeoutId) clearTimeout(networkTimeoutId);
          console.log("Upload completed successfully!");
          const id = upload.url!.split("/api/file/tus/")[1];
          // if id contains a slash, then we use it as it otherwise we need to convert from buffer base64URL to utf-8
          const newId = id.includes("/") ? id : decodeBase64Url(id);
          completeResolve({
            id: newId,
            url: upload.url!,
            relativePath,
            fileName: file.name,
            fileType: file.type,
            numPages,
            ownerId,
            teamId,
          });
        },
      });

      // Set initial timeout
      networkTimeoutId = setTimeout(() => {
        console.error(
          `Initial network timeout after ${60_000}ms (attempt ${attempt + 1})`,
        );
        isTimedOut = true;
        upload.abort();

        // Handle retry after timeout
        const shouldRetry = attempt < retryDelays.length - 1;
        if (shouldRetry) {
          attempt++;
          const delay = retryDelays[attempt] || 10000;
          console.log(
            `Retrying after initial timeout in ${delay}ms (attempt ${attempt + 1}/${retryDelays.length})`,
          );

          setTimeout(() => {
            const newUpload = createUpload();
            resolve(newUpload);
          }, delay);
        } else {
          console.error(
            "Upload failed after initial timeout with no retries left",
          );
          onError?.(new Error("Initial network timeout after 60000ms"));
          reject(new Error("Initial network timeout after 60000ms"));
        }
      }, 60_000);

      // Check if there are any previous uploads to continue.
      upload
        .findPreviousUploads()
        .then((previousUploads) => {
          if (previousUploads.length) {
            console.log("Resuming from previous upload...");
            upload.resumeFromPreviousUpload(previousUploads[0]);
          }
          upload.start();
        })
        .catch((error) => {
          console.error("Error finding previous uploads:", error);
          upload.start();
        });

      return { upload, complete };
    };

    // Start the first upload attempt
    try {
      const result = createUpload();
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}
