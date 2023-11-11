import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { client } from "@/trigger";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // GET /api/teams/:teamId/documents/:id/versions
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    // get document id from query params
    const { teamId, id: documentId } = req.query as { teamId: string; id: string };
    const { url, type, numPages } = req.body as { url: string, type: string, numPages: number };

    console.log("documentId", documentId)
    console.log("file", url)

    const userId = (session.user as CustomUser).id;


    try {
      const { document } = await getTeamWithUsersAndDocument({
        teamId,
        userId,
        docId: documentId,
        checkOwner: true,
        options: {
          select: {
            id: true,
            versions: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { versionNumber: true },
            },
          },
        },
      });

      // get the latest version number for this document
      // const result = await prisma.document.findUnique({
      //   where: {
      //     id: documentId,
      //   },
      //   select: {
      //     versions: {
      //       orderBy: { createdAt: "desc" },
      //       take: 1,
      //       select: { versionNumber: true },
      //     },
      //   },
      // });

      console.log("document", document);

      // create a new document version
      const currentVersionNumber = document?.versions
        ? document.versions[0].versionNumber
        : 1;
      console.log("currentVersionNumber", currentVersionNumber);
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

      console.log("version", version);

      // trigger document uploaded event to trigger convert-pdf-to-image job
      await client.sendEvent({
        name: "document.uploaded",
        payload: { documentVersionId: version.id, versionNumber: version.versionNumber, documentId: documentId },
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
