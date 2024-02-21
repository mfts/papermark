import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export const getPagesCount = async (arrayBuffer: ArrayBuffer) => {
  const pdf = await pdfjs.getDocument(arrayBuffer).promise;
  return pdf.numPages;
};
