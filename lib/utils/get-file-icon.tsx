import { FileIcon, ImageIcon } from "lucide-react";

import DocsIcon from "@/components/shared/icons/files/docs";
import NotionIcon from "@/components/shared/icons/files/notion";
import PdfIcon from "@/components/shared/icons/files/pdf";
import SheetIcon from "@/components/shared/icons/files/sheet";
import SlidesIcon from "@/components/shared/icons/files/slides";

export function fileIcon({
  fileType,
  className = "mx-auto h-6 w-6",
  isLight = true,
}: {
  fileType: string;
  className?: string;
  isLight?: boolean;
}) {
  switch (fileType) {
    case "pdf":
    case "application/pdf":
      return <PdfIcon className={className} isLight={isLight} />;
    case "image/png":
    case "image/jpeg":
    case "image/gif":
    case "image/jpg":
      return <ImageIcon className={className} />;
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/msword":
    case "application/vnd.oasis.opendocument.text":
    case "docs":
      return <DocsIcon className={className} isLight={isLight} />;
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    case "application/vnd.ms-powerpoint":
    case "application/vnd.oasis.opendocument.presentation":
    case "slides":
      return <SlidesIcon className={className} isLight={isLight} />;
    case "application/vnd.ms-excel":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "text/csv":
    case "application/vnd.oasis.opendocument.spreadsheet":
    case "sheet":
      return <SheetIcon className={className} isLight={isLight} />;
    case "notion":
      return <NotionIcon className={className} />;
    default:
      return <FileIcon className={className} />;
  }
}
