import { useMemo } from "react";

import { UploadIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { SUPPORTED_DOCUMENT_MIME_TYPES } from "@/lib/constants";
import { usePlan } from "@/lib/swr/use-billing";
import { bytesToSize } from "@/lib/utils";
import { fileIcon } from "@/lib/utils/get-file-icon";
import { getPagesCount } from "@/lib/utils/get-page-number-count";

const fileSizeLimits: { [key: string]: number } = {
  "application/vnd.ms-excel": 40, // 40 MB
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": 40, // 40 MB
  "application/vnd.oasis.opendocument.spreadsheet": 40, // 40 MB
  "image/png": 100, // 100 MB
  "image/jpeg": 100, // 100 MB
  "image/jpg": 100, // 100 MB
};

export default function DocumentUpload({
  currentFile,
  setCurrentFile,
}: {
  currentFile: File | null;
  setCurrentFile: React.Dispatch<React.SetStateAction<File | null>>;
}) {
  const { theme, systemTheme } = useTheme();
  const isLight =
    theme === "light" || (theme === "system" && systemTheme === "light");
  const { plan, trial } = usePlan();
  const isFreePlan = plan === "free";
  const isTrial = !!trial;
  const maxSize = isFreePlan && !isTrial ? 30 : 100;
  const maxNumPages = isFreePlan && !isTrial ? 100 : 500;

  const { getRootProps, getInputProps } = useDropzone({
    accept:
      isFreePlan && !isTrial
        ? {
            "application/pdf": [], // ".pdf"
            "application/vnd.ms-excel": [], // ".xls"
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
              [], // ".xlsx"
            "text/csv": [], // ".csv"
            "application/vnd.oasis.opendocument.spreadsheet": [], // ".ods"
            "image/png": [], // ".png"
            "image/jpeg": [], // ".jpeg"
            "image/jpg": [], // ".jpg"
          }
        : {
            "application/pdf": [], // ".pdf"
            "application/vnd.ms-excel": [], // ".xls"
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
              [], // ".xlsx"
            "application/vnd.ms-excel.sheet.macroEnabled.12": [".xlsm"], // ".xlsm"
            "text/csv": [], // ".csv"
            "application/vnd.oasis.opendocument.spreadsheet": [], // ".ods"
            "application/vnd.ms-powerpoint": [], // ".ppt"
            "application/vnd.openxmlformats-officedocument.presentationml.presentation":
              [], // ".pptx"
            "application/vnd.oasis.opendocument.presentation": [], // ".odp"
            "application/msword": [], // ".doc"
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
              [], // ".docx"
            "application/vnd.oasis.opendocument.text": [], // ".odt"
            "image/vnd.dwg": [".dwg"], // ".dwg"
            "image/vnd.dxf": [".dxf"], // ".dxf"
            "image/png": [], // ".png"
            "image/jpeg": [], // ".jpeg"
            "image/jpg": [], // ".jpg"
            "application/zip": [], // ".zip"
            "application/x-zip-compressed": [], // ".zip"
          },
    multiple: false,
    maxSize: maxSize * 1024 * 1024, // 30 MB
    onDropAccepted: (acceptedFiles) => {
      const file = acceptedFiles[0];
      const fileType = file.type;
      const fileSizeLimit = fileSizeLimits[fileType] * 1024 * 1024;

      if (file.size > fileSizeLimit) {
        toast.error(
          `File size too big for ${fileType} (max. ${fileSizeLimits[fileType]} MB)`,
        );
        return;
      }

      if (file.type !== "application/pdf") {
        setCurrentFile(file);
        return;
      }
      file
        .arrayBuffer()
        .then((buffer) => {
          getPagesCount(buffer).then((numPages) => {
            if (numPages > maxNumPages) {
              toast.error(`File has too many pages (max. ${maxNumPages})`);
            } else {
              setCurrentFile(file);
            }
          });
        })
        .catch((error) => {
          console.error("Error reading file:", error);
          toast.error("Failed to read the file");
        });
    },
    onDropRejected: (fileRejections) => {
      const { errors, file } = fileRejections[0];
      let message;
      if (errors[0].code === "file-too-large") {
        message = `File size too big (max. ${maxSize} MB)${
          isFreePlan && !isTrial
            ? `. Upgrade to a paid plan to increase the limit.`
            : ""
        }`;
      } else if (errors[0].code === "file-invalid-type") {
        const isSupported = SUPPORTED_DOCUMENT_MIME_TYPES.includes(file.type);
        message = `File type not supported ${
          isFreePlan && !isTrial && isSupported ? `on free plan` : ""
        }`;
      } else {
        message = errors[0].message;
      }
      toast.error(message);
    },
  });

  const imageBlobUrl = useMemo(
    () => (currentFile ? URL.createObjectURL(currentFile) : ""),
    [currentFile],
  );

  return (
    <div className="col-span-full">
      <div
        {...getRootProps()}
        className="group relative block cursor-pointer font-semibold text-foreground hover:bg-gray-100 hover:text-gray-900 hover:dark:bg-gray-900 hover:dark:text-gray-500"
      >
        <input {...getInputProps()} name="file" className="sr-only" />
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-black/25 px-6 py-10 dark:border-white/25 md:min-w-full">
          {currentFile ? (
            <div
              className="pointer-events-none absolute inset-0 opacity-10 transition-opacity group-hover:opacity-5"
              style={{
                backgroundImage: `url(${imageBlobUrl})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            />
          ) : null}

          <div className="max-w-md text-center">
            {currentFile ? (
              <div className="flex flex-col items-center text-foreground sm:flex-row sm:space-x-2">
                <div>
                  {fileIcon({
                    fileType: currentFile.type,
                    isLight,
                  })}
                </div>
                <p className="max-w-md truncate">{currentFile.name}</p>
                <p className="text-gray-500">{bytesToSize(currentFile.size)}</p>
              </div>
            ) : (
              <UploadIcon
                className="mx-auto h-10 w-10 text-gray-500"
                aria-hidden="true"
              />
            )}

            <div className="mt-4 flex text-sm leading-6 text-gray-500">
              <span className="mx-auto">
                {currentFile ? "" : "Choose file to upload or drag and drop"}
              </span>
            </div>
            <p className="text-xs leading-5 text-gray-500">
              {currentFile
                ? "Replace file?"
                : isFreePlan && !isTrial
                  ? `Only *.pdf, *.xls, *.xlsx, *.csv, *.ods, *.png, *.jpeg, *.jpg & ${maxSize} MB limit`
                  : `Only *.pdf, *.pptx, *.docx, *.xlsx, *.xls, *.xlsm, *.csv, *.ods, *.ppt, *.odp, *.doc, *.odt, *.dwg, *.dxf, *.png, *.jpg, *.jpeg & ${maxSize} MB limit`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
