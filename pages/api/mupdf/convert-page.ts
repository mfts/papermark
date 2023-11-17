import { NextApiRequest, NextApiResponse } from "next";
// @ts-ignore
import mupdf from "mupdf";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";

// This function can run for a maximum of 60 seconds
export const config = {
  maxDuration: 60,
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // check if post method
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const { documentVersionId, pageNumber, url } = req.body as {
      documentVersionId: string;
      pageNumber: number;
      url: string; 
    };

    // Fetch the PDF data
    const response = await fetch(url);
    // Convert the response to an ArrayBuffer
    const pdfData = await response.arrayBuffer();
    // Create a MuPDF instance
    var doc = mupdf.Document.openDocument(pdfData, "application/pdf");

    var page = doc.loadPage(pageNumber-1); // 0-based page index
    var pixmap = page.toPixmap(
      // mupdf.Matrix.identity,
      [3,0,0,3,0,0], // scale 3x
      mupdf.ColorSpace.DeviceRGB
    );
    var pngBuffer = pixmap.asPNG();
    const blob = await put(`page-${pageNumber}.png`, pngBuffer, {
      access: "public",
    });

    if (!blob) {
      res.status(500).json({ error: `Failed to upload document page ${pageNumber}` });
      return;
    }

    const documentPage = await prisma.documentPage.create({
      data: {
        versionId: documentVersionId,
        pageNumber: pageNumber,
        file: blob.url,
      },
    });

    if (!documentPage) {
      res.status(500).json({ error: "Failed to create document page" });
      return;
    }

    // Send the images as a response
    res.status(200).json({ documentPageId: documentPage.id });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
