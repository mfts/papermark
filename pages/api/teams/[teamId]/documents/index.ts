import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { getExtension, log } from "@/lib/utils";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { errorhandler } from "@/lib/errorHandler";
import { client } from "@/trigger";
import notion from "@/lib/notion";
import { parsePageId } from "notion-utils";
import { DocumentStorageType } from "@prisma/client";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
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
    const {
      name,
      url: fileUrl,
      numPages,
      type: fileType,
      storageType,
    } = req.body as {
      name: string;
      url: string;
      numPages: number;
      type?: string;
      storageType: DocumentStorageType;
    };

    try {
      await getTeamWithUsersAndDocument({
        teamId,
        userId,
      });

      // Get passed type property or alternatively, the file extension and save it as the type
      const type = fileType || getExtension(name);

      // Check whether the Notion page is publically accessible or not
      if (type === "notion") {
        try {
          const pageId = parsePageId(fileUrl, { uuid: false });
          // if the page isn't accessible then end the process here.
          await notion.getPage(pageId);
        } catch (error) {
          return res
            .status(404)
            .end("This Notion page isn't publically available.");
        }
      }

      // Save data to the database
      const document = await prisma.document.create({
        data: {
          name: name,
          numPages: numPages,
          file: fileUrl,
          type: type,
          storageType,
          ownerId: (session.user as CustomUser).id,
          teamId: teamId,
          pinned: false,
          links: {
            create: {},
          },
          versions: {
            create: {
              file: fileUrl,
              type: type,
              storageType,
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

      // skip triggering convert-pdf-to-image job for "notion" documents
      if (type !== "notion") {
        // trigger document uploaded event to trigger convert-pdf-to-image job
        await client.sendEvent({
          id: document.versions[0].id, // unique eventId for the run
          name: "document.uploaded",
          payload: {
            documentVersionId: document.versions[0].id,
            teamId: teamId,
          },
        });
      }

      return res.status(201).json(document);
    } catch (error) {
      log({
        message: `Failed to create document. \n\n*teamId*: _${teamId}_, \n\n*file*: ${fileUrl} \n\n ${error}`,
        type: "error",
      });
      errorhandler(error, res);
    }
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
