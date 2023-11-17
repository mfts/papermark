import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { getExtension, log } from "@/lib/utils";
import { identifyUser, trackAnalytics } from "@/lib/analytics";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { errorhandler } from "@/lib/errorHandler";
import { client } from "@/trigger";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/documents
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId } = req.query as { teamId: string };

    const userId = (session.user as CustomUser).id;

    try {
      const { team } = await getTeamWithUsersAndDocument({
        teamId,
        userId,
        options: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            _count: {
              select: { links: true, views: true, versions: true },
            },
            links: {
              take: 1,
              select: { id: true },
            },
          },
        },
      });

      const documents = team.documents;

      return res.status(200).json(documents);
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/documents
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const { teamId } = req.query as { teamId: string };

    const userId = (session.user as CustomUser).id;

    // Assuming data is an object with `name` and `description` properties
    const { name, url: fileUrl, numPages } = req.body as { name: string; url: string; numPages: number }

    try {
      await getTeamWithUsersAndDocument({
        teamId,
        userId,
      });

      // Get the file extension and save it as the type
      const type = getExtension(name);

      // You could perform some validation here

      // Save data to the database
      const document = await prisma.document.create({
        data: {
          name: name,
          numPages: numPages,
          file: fileUrl,
          type: type,
          ownerId: (session.user as CustomUser).id,
          teamId: teamId,
          links: {
            create: {},
          },
          versions: {
            create: {
              file: fileUrl,
              type: type,
              numPages: numPages,
              isPrimary: true,
              versionNumber: 1,
            },
          },
        },
        include: {
          links: true,
          versions: true,
        },
      });

      // calculate the path of the page where the document was added
      const referer = req.headers.referer;
      let pathWithQuery = null;
      if (referer) {
        const url = new URL(referer);
        pathWithQuery = url.pathname + url.search;
      }

      await identifyUser((session.user as CustomUser).id);
      await trackAnalytics({
        event: "Document Added",
        documentId: document.id,
        name: document.name,
        fileSize: null,
        path: pathWithQuery,
      });
      await trackAnalytics({
        event: "Link Added",
        linkId: document.links[0].id,
        documentId: document.id,
        customDomain: null,
      });

      // trigger document uploaded event to trigger convert-pdf-to-image job
      await client.sendEvent({
        name: "document.uploaded",
        payload: { documentVersionId: document.versions[0].id },
      });

      return res.status(201).json(document);
    } catch (error) {
      log(
        `Failed to create document. \n\n teamId: ${teamId}, file: ${fileUrl} \n\n ${error}`
      );
      errorhandler(error, res);
    }
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
