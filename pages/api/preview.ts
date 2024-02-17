import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // We only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }
  // POST /api/preview
  const { linkId, documentVersionId, hasPages } = req.body as {
    linkId: string;
    documentVersionId: string;
    hasPages: boolean;
  };

  try {
    // if document version has pages, then return pages
    // otherwise, return file from document version
    let documentPages, documentVersion;

    if (hasPages) {
      documentPages = await prisma.documentPage.findMany({
        where: { versionId: documentVersionId },
        orderBy: { pageNumber: "asc" },
        select: {
          file: true,
          pageNumber: true,
        },
      });
    } else {
      documentVersion = await prisma.documentVersion.findUnique({
        where: { id: documentVersionId },
        select: {
          file: true,
        },
      });
    }

    const returnObject = {
      file: documentVersion ? documentVersion.file : null,
      pages: documentPages ? documentPages : null,
    };

    return res.status(200).json(returnObject);
  } catch (error) {
    console.log(`Failed to record view for ${linkId}. Error: \n\n ${error}`);
    return res.status(500).json({ message: (error as Error).message });
  }
}
