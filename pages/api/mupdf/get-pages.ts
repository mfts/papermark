import { NextApiRequest, NextApiResponse } from "next";

import * as mupdf from "mupdf";

const MAX_PDF_SIZE_MB = 500;
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (token !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  let doc: mupdf.PDFDocument | null = null;

  try {
    const { url } = req.body as { url: string };

    const response = await fetch(url);

    if (!response.ok) {
      res.status(502).json({
        error: "Failed to fetch PDF",
        details: `HTTP ${response.status}`,
      });
      return;
    }

    const pdfData = await response.arrayBuffer();

    if (pdfData.byteLength > MAX_PDF_SIZE_BYTES) {
      res.status(413).json({
        error: "PDF too large",
        details: `PDF size ${(pdfData.byteLength / 1024 / 1024).toFixed(1)}MB exceeds limit of ${MAX_PDF_SIZE_MB}MB`,
      });
      return;
    }

    doc = new mupdf.PDFDocument(pdfData);
    const n = doc.countPages();

    res.status(200).json({ numPages: n });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isWasmOOM =
      message.includes("memory access out of bounds") ||
      message.includes("out of memory") ||
      message.includes("malloc");

    console.error("Error in get-pages:", message);

    if (isWasmOOM) {
      res.status(503).json({
        error: "Service temporarily unavailable",
        details:
          "WASM memory limit reached. The request will succeed on retry.",
      });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  } finally {
    if (doc) {
      try {
        doc.destroy();
      } catch (e) {
        console.error("Error destroying document in get-pages:", e);
      }
    }
  }
};
