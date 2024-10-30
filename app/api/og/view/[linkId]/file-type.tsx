export function ogFileType({ fileType }: { fileType: string }): string {
  switch (fileType) {
    case "pdf":
    case "application/pdf":
      return "PDF Document";
    case "image/png":
    case "image/jpeg":
    case "image/jpg":
    case "image":
      return "Image";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/msword":
    case "application/vnd.oasis.opendocument.text":
    case "docs":
      return "Document";
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    case "application/vnd.ms-powerpoint":
    case "application/vnd.oasis.opendocument.presentation":
    case "slides":
      return "Presentation Slides";
    case "application/vnd.ms-excel":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "text/csv":
    case "application/vnd.oasis.opendocument.spreadsheet":
    case "sheet":
      return "Spreadsheet Document";
    case "notion":
      return "Notion Page";
    case "image/vnd.dwg":
    case "image/vnd.dxf":
    case "cad":
      return "CAD Drawing";
    case "dataroom":
      return "Dataroom";
    default:
      return "Papermark File";
  }
}
