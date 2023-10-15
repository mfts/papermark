import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { getExtension, log } from "@/lib/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // POST /api/teams/:teamId/documents/update
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    // Assuming data is an object with `name` and `description` properties
    const { documentId, numPages } = req.body;

    const { teamId } = req.query as { teamId: string };

    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
        include: {
          users: {
            select: {
              userId: true,
            },
          },
          documents: {
            select: {
              id: true,
            },
          },
        },
      });

      // check if the team exists
      if (!team) {
        res.status(400).end("Team doesn't exists");
      }

      // check if the user is part the team
      const teamHasUser = team?.users.some((user) => user.userId === userId);
      if (!teamHasUser) {
        res.status(401).end("You are not a member of the team");
      }

      // check if the document exists in the team
      const teamHasDocument = team?.documents.some(
        (doc) => doc.id === documentId
      );
      if (!teamHasDocument) {
        return res.status(400).end("Document doesn't exists in the team");
      }

      // Save data to the database
      await prisma.document.update({
        where: { id: documentId },
        data: {
          numPages: numPages,
          // versions: {
          //   update: {
          //     where: { id: documentId },
          //     data: { numPages: numPages },
          //   },
          // },
        },
      });

      res.status(201).json({ message: "Document updated successfully" });
    } catch (error) {
      log(`Failed to create document. Error: \n\n ${error}`);
      res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
