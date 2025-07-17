export interface DocumentPreviewData {
  documentId: string;
  documentName: string;
  documentType: string;
  fileType: string;
  isVertical: boolean;
  numPages: number;
  pages?: {
    file: string;
    pageNumber: string;
    embeddedLinks: string[];
    pageLinks: { href: string; coords: string }[];
    metadata: { width: number; height: number; scaleFactor: number };
  }[];
  file?: string;
  sheetData?: any;
}
