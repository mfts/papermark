import { NextApiRequest, NextApiResponse } from "next";

import * as mupdf from "mupdf";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // check if post method
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  // Extract the API Key from the Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1]; // Assuming the format is "Bearer [token]"

  // Check if the API Key matches
  if (token !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const { url } = req.body as { url: string };
    // Fetch the PDF data
    const response = await fetch(url);
    // Convert the response to an ArrayBuffer
    const pdfData = await response.arrayBuffer();
    // Create a MuPDF instance
    var doc = new mupdf.PDFDocument(pdfData);

    var n = doc.countPages();

    // Send the images as a response
    res.status(200).json({ numPages: n });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
