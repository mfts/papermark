import { NextApiRequest, NextApiResponse } from "next";

import { DocumentPage } from "@prisma/client";
import * as mupdf from "mupdf";

import { putFileServer } from "@/lib/files/put-file-server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

// This function can run for a maximum of 120 seconds
export const config = {
  maxDuration: 180,
};

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

  const { documentVersionId, pageNumber, url, teamId } = req.body as {
    documentVersionId: string;
    pageNumber: number;
    url: string;
    teamId: string;
  };

  try {
    // Fetch the PDF data
    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      log({
        message: `Failed to fetch PDF in conversion process with error: \n\n Error: ${error} \n\n \`Metadata: {teamId: ${teamId}, documentVersionId: ${documentVersionId}, pageNumber: ${pageNumber}}\``,
        type: "error",
        mention: true,
      });
      throw new Error(`Failed to fetch pdf on document page ${pageNumber}`);
    }

    // Convert the response to a buffer
    const pdfData = await response.arrayBuffer();
    // Create a MuPDF instance
    var doc = mupdf.Document.openDocument(pdfData, "application/pdf");

    // Scale the document to 300 DPI
    const doc_to_screen = mupdf.Matrix.scale(216 / 72, 216 / 72); // scale 3x // to 216 DPI

    let page = doc.loadPage(pageNumber - 1); // 0-based page index

    if (pageNumber === 1) {
      // get the orientation of the document and update document version
      const bounds = page.getBounds();
      const [ulx, uly, lrx, lry] = bounds;

      const width = Math.abs(lrx - ulx);
      const height = Math.abs(lry - uly);

      const isVertical = height > width;

      await prisma.documentVersion.update({
        where: { id: documentVersionId },
        data: { isVertical },
      });
    }

    // get links
    const links = page.getLinks();
    const embeddedLinks = links.map((link: any) => link.getURI());

    let pixmap = page.toPixmap(
      // [3, 0, 0, 3, 0, 0], // scale 3x // to 300 DPI
      doc_to_screen,
      mupdf.ColorSpace.DeviceRGB,
      false,
      true,
    );

    const pngBuffer = pixmap.asPNG(); // as PNG

    let buffer = Buffer.from(pngBuffer);

    // get docId from url with starts with "doc_" with regex
    const match = url.match(/(doc_[^\/]+)\//);
    const docId = match ? match[1] : undefined;

    const { type, data } = await putFileServer({
      file: {
        name: `page-${pageNumber}.png`,
        type: "image/png",
        buffer: buffer,
      },
      teamId: teamId,
      docId: docId,
    });

    buffer = Buffer.alloc(0); // free memory
    pixmap.destroy(); // free memory
    page.destroy(); // free memory

    if (!data || !type) {
      throw new Error(`Failed to upload document page ${pageNumber}`);
    }

    let documentPage: DocumentPage | null = null;

    // Check if a documentPage with the same pageNumber and versionId already exists
    const existingPage = await prisma.documentPage.findUnique({
      where: {
        pageNumber_versionId: {
          pageNumber: pageNumber,
          versionId: documentVersionId,
        },
      },
    });

    if (!existingPage) {
      // Only create a new documentPage if it doesn't already exist
      documentPage = await prisma.documentPage.create({
        data: {
          versionId: documentVersionId,
          pageNumber: pageNumber,
          file: data,
          storageType: type,
          embeddedLinks: embeddedLinks,
        },
      });
    } else {
      documentPage = existingPage;
    }

    // Send the images as a response
    res.status(200).json({ documentPageId: documentPage.id });
    return;
  } catch (error) {
    log({
      message: `Failed to convert page with error: \n\n Error: ${error} \n\n \`Metadata: {teamId: ${teamId}, documentVersionId: ${documentVersionId}, pageNumber: ${pageNumber}}\``,
      type: "error",
      mention: true,
    });
    throw error;
  }
};
