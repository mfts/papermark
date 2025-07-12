import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  PUT: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId, agreementId } = req.query as {
      teamId: string;
      agreementId: string;
    };

    if (!teamId || !agreementId) {
      res.status(401).json("Unauthorized");
      return;
    }

    try {
      await prisma.agreement.update({
        where: {
          id: agreementId,
          teamId,
        },
        data: {
          deletedAt: new Date(),
          deletedBy: req.user.id,
        },
      });

      res.status(200).json({ message: "Agreement deleted" });
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
