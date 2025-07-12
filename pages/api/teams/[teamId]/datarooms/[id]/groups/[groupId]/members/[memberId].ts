import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // DELETE /api/teams/:teamId/datarooms/:id/groups/:groupId/members/:memberId
  const { memberId } = req.query as {
    memberId: string;
  };

  try {
    await prisma.viewerGroupMembership.delete({
      where: { id: memberId },
    });
    res.status(204).end();
  } catch (error) {
    errorhandler(error, res);
  }
}

export default createTeamHandler({
  DELETE: handler,
});
