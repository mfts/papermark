import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { CustomUser } from "@/lib/types";
import { getExtension, log } from "@/lib/utils";

import { authOptions } from "../../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
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
      await getTeamWithUsersAndDocument({
        teamId,
        userId,
        docId: documentId,
      });

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

      return res.status(201).json({ message: "Document updated successfully" });
    } catch (error) {
      log({
        message: `Failed to update document: _${documentId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
        type: "error",
      });
      errorhandler(error, res);
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
