import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { log } from "@/lib/utils";

async function handleUpdateDocument(
  req: AuthenticatedRequest,
  res: NextApiResponse,
): Promise<void> {
  // Assuming data is an object with `name` and `description` properties
  const { documentId, numPages } = req.body;
  const { teamId } = req.query as { teamId: string };

  try {
    await getTeamWithUsersAndDocument({
      teamId,
      userId: req.user.id,
      docId: documentId,
    });

    // Save data to the database
    await prisma.document.update({
      where: { id: documentId },
      data: {
        numPages: numPages,
      },
    });

    res.status(201).json({ message: "Document updated successfully" });
  } catch (error) {
    log({
      message: `Failed to update document: _${documentId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${req.user.id}}\``,
      type: "error",
    });
    errorhandler(error, res);
  }
}

export default createTeamHandler({
  POST: handleUpdateDocument,
});
