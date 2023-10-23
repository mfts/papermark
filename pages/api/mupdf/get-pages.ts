import { NextApiRequest, NextApiResponse } from "next";
// import fs from "fs";
// import path from "path";

// // 1. Synchronously load the wasm binary
// const wasmFilePath = path.join(process.cwd(), "public", "mupdf/mupdf-wasm.wasm");
// const wasmBinary = fs.readFileSync(wasmFilePath);

// // 2. Ensure the wasm module uses this binary for its initialization.
// globalThis.Module = {
//   wasmBinary: wasmBinary,
//   locateFile: (filename: string) => {
//     if (filename.endsWith(".wasm")) {
//       return wasmFilePath;
//     }
//     return filename;
//   },
// };

// Load mupdf from the local directory.
// @ts-ignore
// import mupdf from "mupdf";

const mupdf = require("mupdf");


export default async (req: NextApiRequest, res: NextApiResponse) => {
  // check if post method 
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }
  
  try {

    const { url } = req.body as { url: string };
    // Fetch the PDF data
    const response = await fetch(url);
    // Convert the response to an ArrayBuffer
    const pdfData = await response.arrayBuffer();
    // Create a MuPDF instance
    var doc = mupdf.Document.openDocument(pdfData, "application/pdf");

    var n = doc.countPages();
    
    // Send the images as a response
    res.status(200).json({ numPages: n });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
