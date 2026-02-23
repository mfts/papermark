import { PDF, SecurityError } from "@libpdf/core";
import * as XLSX from "xlsx";

export const getPagesCount = async (arrayBuffer: ArrayBuffer) => {
  try {
    const bytes = new Uint8Array(arrayBuffer);
    const pdf = await PDF.load(bytes);
    return pdf.getPageCount();
  } catch (error) {
    if (error instanceof SecurityError) {
      console.warn("PDF is password-protected, cannot determine page count");
    } else {
      console.error("Error getting PDF page count:", error);
    }
    return 1; // Assuming at least one page if we can't determine
  }
};

export const getSheetsCount = (arrayBuffer: ArrayBuffer) => {
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: "array" });
  return workbook.SheetNames.length ?? 1;
};
