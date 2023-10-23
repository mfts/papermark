import { NextApiRequest, NextApiResponse } from "next";
// @ts-ignore
import mupdf from "mupdf";


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
