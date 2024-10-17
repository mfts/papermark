import { SVGProps } from "react";

import CadIcon from "./files/og-cad";
import DocsIcon from "./files/og-docs";
import FileIcon from "./files/og-file";
import ImageFileIcon from "./files/og-image";
import NotionIcon from "./files/og-notion";
import PdfIcon from "./files/og-pdf";
import SheetIcon from "./files/og-sheet";
import SlidesIcon from "./files/og-slides";

export function ogFileIcon({
  fileType,
  ...props
}: {
  fileType: string;
  props?: SVGProps<SVGSVGElement>;
}) {
  switch (fileType) {
    case "pdf":
    case "application/pdf":
      return <PdfIcon {...props} />;
    case "image/png":
    case "image/jpeg":
    case "image/jpg":
    case "image":
      return <ImageFileIcon {...props} />;
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/msword":
    case "application/vnd.oasis.opendocument.text":
    case "docs":
      return <DocsIcon {...props} />;
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    case "application/vnd.ms-powerpoint":
    case "application/vnd.oasis.opendocument.presentation":
    case "slides":
      return <SlidesIcon {...props} />;
    case "application/vnd.ms-excel":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "text/csv":
    case "application/vnd.oasis.opendocument.spreadsheet":
    case "sheet":
      return <SheetIcon {...props} />;
    case "notion":
      return <NotionIcon {...props} />;
    case "image/vnd.dwg":
    case "image/vnd.dxf":
    case "cad":
      return <CadIcon {...props} />;
    default:
      return <FileIcon {...props} />;
  }
}
