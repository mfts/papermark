import { pdfjs } from "react-pdf";
import * as XLSX from "xlsx";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export const getPagesCount = async (arrayBuffer: ArrayBuffer) => {
  const pdf = await pdfjs.getDocument(arrayBuffer).promise;
  return pdf.numPages;
};

export const getSheetsCount = (arrayBuffer: ArrayBuffer) => {
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: "array" });
  return workbook.SheetNames.length ?? 1;
};
