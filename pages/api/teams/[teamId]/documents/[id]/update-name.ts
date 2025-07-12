import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createAuthenticatedHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";

export default createAuthenticatedHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId, id: docId } = req.query as { teamId: string; id: string };

    try {
      await getTeamWithUsersAndDocument({
        teamId,
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
