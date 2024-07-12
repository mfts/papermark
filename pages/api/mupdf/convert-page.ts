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
    var doc = new mupdf.PDFDocument(pdfData);
    console.log("Original document size:", pdfData.byteLength);

    const page = doc.loadPage(pageNumber - 1); // 0-based page index
    // get the bounds of the page for orientation and scaling
    const bounds = page.getBounds();
    const [ulx, uly, lrx, lry] = bounds;
    const widthInPoints = Math.abs(lrx - ulx);
    const heightInPoints = Math.abs(lry - uly);

    if (pageNumber === 1) {
      // get the orientation of the document and update document version
      const isVertical = heightInPoints > widthInPoints;

      await prisma.documentVersion.update({
        where: { id: documentVersionId },
        data: { isVertical },
      });
    }

    // Scale the document to 144 DPI
    const scaleFactor = widthInPoints >= 1600 ? 2 : 3; // 2x for width >= 1600, 3x for width < 1600
    const doc_to_screen = mupdf.Matrix.scale(scaleFactor, scaleFactor);

    console.log("Scale factor:", scaleFactor);

    // get links
    const links = page.getLinks();
    const embeddedLinks = links.map((link) => {
      return { href: link.getURI(), coords: link.getBounds().join(",") };
    });

    const metadata = {
      originalWidth: widthInPoints,
      originalHeight: heightInPoints,
      width: widthInPoints * scaleFactor,
      height: heightInPoints * scaleFactor,
      scaleFactor: scaleFactor,
    };

    console.time("toPixmap");
    let scaledPixmap = page.toPixmap(
      // [3, 0, 0, 3, 0, 0], // scale 3x // to 300 DPI
      doc_to_screen,
      mupdf.ColorSpace.DeviceRGB,
      false,
      true,
    );
    console.timeEnd("toPixmap");

    console.time("compare");
    console.time("asPNG");
    const pngBuffer = scaledPixmap.asPNG(); // as PNG
    console.timeEnd("asPNG");
    console.time("asJPEG");
    const jpegBuffer = scaledPixmap.asJPEG(80, false); // as JPEG
    console.timeEnd("asJPEG");

    const pngSize = pngBuffer.byteLength;
    const jpegSize = jpegBuffer.byteLength;

    let chosenBuffer;
    let chosenFormat;
    if (pngSize < jpegSize) {
      chosenBuffer = pngBuffer;
      chosenFormat = "png";
    } else {
      chosenBuffer = jpegBuffer;
      chosenFormat = "jpeg";
    }

    console.log("Chosen format:", chosenFormat);

    console.timeEnd("compare");

    let buffer = Buffer.from(chosenBuffer);

    // get docId from url with starts with "doc_" with regex
    const match = url.match(/(doc_[^\/]+)\//);
    const docId = match ? match[1] : undefined;

    const { type, data } = await putFileServer({
      file: {
        name: `page-${pageNumber}.${chosenFormat}`,
        type: `image/${chosenFormat}`,
        buffer: buffer,
      },
      teamId: teamId,
      docId: docId,
    });

    buffer = Buffer.alloc(0); // free memory
    chosenBuffer = Buffer.alloc(0); // free memory
    scaledPixmap.destroy(); // free memory
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
          pageLinks: embeddedLinks,
          metadata: metadata,
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
