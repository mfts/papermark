export function getSupportedContentType(contentType: string): string | null {
  switch (contentType) {
    case "application/pdf":
      return "pdf";
    case "application/vnd.ms-excel":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.ms-excel.sheet.macroEnabled.12":
    case "text/csv":
    case "application/vnd.oasis.opendocument.spreadsheet":
      return "sheet";
    case "application/msword":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/vnd.oasis.opendocument.text":
      return "docs";
    case "application/vnd.ms-powerpoint":
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    case "application/vnd.oasis.opendocument.presentation":
      return "slides";
    case "image/vnd.dwg":
    case "image/vnd.dxf":
      return "cad";
    case "image/png":
    case "image/jpeg":
    case "image/jpg":
      return "image";
    case "application/zip":
    case "application/x-zip-compressed":
      return "zip";
    case "video/mp4":
    case "video/quicktime":
    case "video/x-msvideo":
    case "video/webm":
    case "video/ogg":
      return "video";
    case "application/vnd.google-earth.kml+xml":
    case "application/vnd.google-earth.kmz":
      return "map";
    default:
      return null;
  }
}

export function getExtensionFromContentType(
  contentType: string,
): string | null {
  switch (contentType) {
    case "application/pdf":
      return "pdf";
    case "application/vnd.ms-excel":
      return "xls";
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return "xlsx";
    case "application/vnd.ms-excel.sheet.macroEnabled.12":
      return "xlsm";
    case "text/csv":
      return "csv";
    case "application/vnd.oasis.opendocument.spreadsheet":
      return "ods";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "docx";
    case "application/vnd.oasis.opendocument.text":
      return "odt";
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      return "pptx";
    case "application/vnd.oasis.opendocument.presentation":
      return "odp";
    case "application/vnd.ms-powerpoint":
      return "ppt";
    case "application/msword":
      return "doc";
    case "image/vnd.dwg":
      return "dwg";
    case "image/vnd.dxf":
      return "dxf";
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpeg";
    case "image/jpg":
      return "jpg";
    case "video/mp4":
      return "mp4";
    case "video/quicktime":
      return "mov";
    case "video/x-msvideo":
      return "avi";
    case "video/webm":
      return "webm";
    case "video/ogg":
      return "ogg";
    case "application/vnd.google-earth.kml+xml":
      return "kml";
    case "application/vnd.google-earth.kmz":
      return "kmz";
    default:
      return null;
  }
}
