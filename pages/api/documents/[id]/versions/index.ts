import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // GET /api/documents/:id/versions
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    // get document id from query params
    const { id: documentId } = req.query as { id: string };
    const { url, type, numPages } = req.body as { url: string, type: string, numPages: number };

    console.log("documentId", documentId)
    console.log("file", url)


    try {
      // get the latest version number for this document
      const result = await prisma.document.findUnique({
        where: {
          id: documentId,
        },
        select: {
          versions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { versionNumber: true },
          },
        },
      });

      console.log("result", result)

      // create a new document version
      const currentVersionNumber = result?.versions[0]?.versionNumber!;
      console.log("currentVersionNumber", currentVersionNumber)
      const version = await prisma.documentVersion.create({
        data: {
          documentId: documentId,
          file: url,
          type: type,
          numPages: numPages,
          isPrimary: true,
          versionNumber: currentVersionNumber + 1,
        },
      });

      console.log("version", version)

      // update all other versions to be not primary
      await prisma.documentVersion.updateMany({
        where: {
          documentId: documentId,
          versionNumber: {
            not: version.versionNumber,
          },
        },
        data: {
          isPrimary: false,
        },
      });


      res.status(200).json({ id: documentId });
    } catch (error) {
      log(
        `Failed to create new version for document ${documentId}. Error: \n\n ${error}`
      );
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow GET requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
