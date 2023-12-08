import { useMemo } from "react";
import { useDropzone } from "react-dropzone";
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import {
  DocumentTextIcon,
  PresentationChartBarIcon,
} from "@heroicons/react/20/solid";
import { bytesToSize } from "@/lib/utils";
import { toast } from "sonner";

function fileIcon(fileType: string) {
  switch (fileType) {
    case "application/pdf":
      return <DocumentTextIcon className="h-6 w-6 mx-auto" />;
    case "image/png":
    case "image/jpeg":
    case "image/gif":
    case "image/jpg":
      return <PhotoIcon className="h-6 w-6 mx-auto" />;
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    case "application/vnd.ms-powerpoint":
    case "application/msword":
      return <PresentationChartBarIcon className="h-6 w-6 mx-auto" />;
    default:
      return <DocumentIcon className="h-6 w-6 mx-auto" />;
  }
}

export default function DocumentUpload({
  currentFile,
  setCurrentFile,
}: {
  currentFile: File | null;
  setCurrentFile: React.Dispatch<React.SetStateAction<File | null>>;
}) {
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/pdf": [], // ".pdf"
    },
    multiple: false,
    maxSize: 30 * 1024 * 1024, // 30 MB
    onDropAccepted: (acceptedFiles) => {
      setCurrentFile(acceptedFiles[0]);
    },
    onDropRejected: (fileRejections) => {
      const { errors } = fileRejections[0];
      let message;
      if (errors[0].code === "file-too-large") {
        message = "File size too big (max. 30 MB)";
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
        className="relative cursor-pointer font-semibold text-foreground hover:text-gray-900 hover:bg-gray-100 hover:dark:text-gray-500 hover:dark:bg-gray-900 block group"
      >
        <input {...getInputProps()} name="file" className="sr-only" />
        <div className="flex justify-center rounded-lg border border-dashed border-black/25 dark:border-white/25 px-6 py-10 min-h-[200px] md:min-w-full items-center">
          {currentFile ? (
            <div
              className="absolute inset-0 opacity-10 pointer-events-none group-hover:opacity-5 transition-opacity"
              style={{
                backgroundImage: `url(${imageBlobUrl})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            />
          ) : null}
          <div className="text-center">
            {currentFile ? (
              <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-x-2 text-foreground">
                <div>{fileIcon(currentFile.type)}</div>
                <p>{currentFile.name}</p>
                <p className="text-gray-500">{bytesToSize(currentFile.size)}</p>
              </div>
            ) : (
              <ArrowUpTrayIcon
                className="mx-auto h-12 w-12 text-gray-500"
                aria-hidden="true"
              />
            )}

            <div className="mt-4 flex text-sm leading-6 text-gray-500">
              <span className="mx-auto">
                {currentFile ? "" : "Choose file to upload or drag and drop"}
              </span>
            </div>
            <p className="text-xs leading-5 text-gray-500">
              {currentFile ? "Replace file?" : "Only *.pdf & 30 MB limit"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
