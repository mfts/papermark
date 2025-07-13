import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";

export default createTeamHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { id: docId } = req.query as { id: string };

    try {
      await getTeamWithUsersAndDocument({
        teamId: req.team.id,
        userId: req.user.id,
        docId,
        checkOwner: true,
        options: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      });

      await prisma.document.update({
        where: {
          id: docId,
        },
        data: {
          name: req.body.name,
        },
      });

      res.status(200).json({ message: "Document name updated!" });
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
