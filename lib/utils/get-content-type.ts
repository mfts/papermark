export function getSupportedContentType(contentType: string): string | null {
  switch (contentType) {
    case "application/pdf":
      return "pdf";
    case "application/vnd.ms-excel":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "text/csv":
    case "application/vnd.oasis.opendocument.spreadsheet":
      return "sheet";
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
    case "text/csv":
      return "csv";
    case "application/vnd.oasis.opendocument.spreadsheet":
      return "ods";
    default:
      return null;
  }
}

export function getExtensionFromSupportedType(
  supportedType: string,
): string | null {
  switch (supportedType) {
    case "pdf":
      return "pdf";
    case "sheet":
      return "xlsx";
    default:
      return null;
  }
}

export function getMimeTypeFromSupportedType(
  supportedType: string,
): string | null {
  switch (supportedType) {
    case "pdf":
      return "application/pdf";
    case "sheet":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    default:
      return null;
  }
}
