import { useMemo } from "react";

import {
  Upload as ArrowUpTrayIcon,
  File as DocumentIcon,
  FileText as DocumentTextIcon,
  FileSpreadsheetIcon,
  Image as PhotoIcon,
  Presentation as PresentationChartBarIcon,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { usePlan } from "@/lib/swr/use-billing";
import { bytesToSize } from "@/lib/utils";
import { getPagesCount } from "@/lib/utils/get-page-number-count";

const fileSizeLimits: { [key: string]: number } = {
  "application/vnd.ms-excel": 100, // 30 MB
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": 30, // 30 MB
  "text/csv": 30, // 30 MB
  "application/vnd.oasis.opendocument.spreadsheet": 30, // 30 MB
};

function fileIcon(fileType: string) {
  switch (fileType) {
    case "application/pdf":
      return <DocumentTextIcon className="mx-auto h-6 w-6" />;
    case "image/png":
    case "image/jpeg":
    case "image/gif":
    case "image/jpg":
      return <PhotoIcon className="mx-auto h-6 w-6" />;
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    case "application/vnd.ms-powerpoint":
    case "application/msword":
      return <PresentationChartBarIcon className="mx-auto h-6 w-6" />;
    case "application/vnd.ms-excel":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "text/csv":
    case "application/vnd.oasis.opendocument.spreadsheet":
      return <FileSpreadsheetIcon className="mx-auto h-6 w-6" />;
    default:
      return <DocumentIcon className="mx-auto h-6 w-6" />;
  }
}

export default function DocumentUpload({
  currentFile,
  setCurrentFile,
}: {
  currentFile: File | null;
  setCurrentFile: React.Dispatch<React.SetStateAction<File | null>>;
}) {
  const { plan, loading } = usePlan();
  const maxSize = plan === "business" || plan === "datarooms" ? 100 : 30;
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/pdf": [], // ".pdf"
      "application/vnd.ms-excel": [], // ".xls"
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [], // ".xlsx"
      "text/csv": [], // ".csv"
      "application/vnd.oasis.opendocument.spreadsheet": [], // ".ods"
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
            if (numPages > 250) {
              toast.error("File has too many pages (max. 100)");
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
      const { errors } = fileRejections[0];
      let message;
      if (errors[0].code === "file-too-large") {
        message = `File size too big (max. ${maxSize} MB)`;
      } else if (errors[0].code === "file-invalid-type") {
        message = "File type not supported (.pdf only)";
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
          <div className="text-center">
            {currentFile ? (
              <div className="flex flex-col items-center space-y-1 text-foreground sm:flex-row sm:space-x-2">
                <div>{fileIcon(currentFile.type)}</div>
                <p>{currentFile.name}</p>
                <p className="text-gray-500">{bytesToSize(currentFile.size)}</p>
              </div>
            ) : (
              <ArrowUpTrayIcon
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
                : `Only *.pdf & ${maxSize} MB limit`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
