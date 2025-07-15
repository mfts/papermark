import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // GET /api/teams/:teamId/datarooms/:id/groups/:groupId
    const {
      teamId,
      id: dataroomId,
      groupId,
    } = req.query as {
      teamId: string;
      id: string;
      groupId: string;
    };
    const userId = req.user.id;

    try {
      const group = await prisma.viewerGroup.findUnique({
        where: {
          id: groupId,
          dataroomId: dataroomId,
        },
        include: {
          members: {
            include: {
              viewer: true,
            },
          },
          accessControls: true,
        },
      });

      return res.status(200).json(group);
    } catch (error) {
      log({
        message: `Failed to get group for dataroom: _${dataroomId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
        type: "error",
      });
      errorhandler(error, res);
    }
  },
  PATCH: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // PATCH /api/teams/:teamId/datarooms/:id/groups/:groupId
    const {
      teamId,
      id: dataroomId,
      groupId,
    } = req.query as {
      teamId: string;
      id: string;
      groupId: string;
    };

    const { name, domains, allowAll } = req.body as {
      name?: string;
      domains?: string[];
      allowAll?: boolean;
    };
    const userId = req.user.id;

    try {
      const group = await prisma.viewerGroup.update({
        where: {
          id: groupId,
          dataroomId: dataroomId,
          teamId: teamId,
          team: {
            users: {
              some: {
                userId: userId,
              },
            },
          },
        },
        data: {
          ...(name && { name }),
          ...(typeof allowAll === "boolean" && { allowAll }),
          ...(domains && { domains }),
        },
      });

      return res.status(200).json(group);
    } catch (error) {
      log({
        message: `Failed to update group for dataroom: _${dataroomId}_. \n\n ${error} \n\n*Metadata*: \`{groupId: ${groupId}, teamId: ${teamId}, userId: ${userId}}\``,
        type: "error",
      });
      errorhandler(error, res);
    }
  },
  DELETE: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // DELETE /api/teams/:teamId/datarooms/:id/groups/:groupId
    const {
      teamId,
      id: dataroomId,
      groupId,
    } = req.query as {
      teamId: string;
      id: string;
      groupId: string;
    };
    const userId = req.user.id;

    try {
      // delete links associated with the group
      await prisma.link.deleteMany({
        where: {
          groupId: groupId,
          dataroomId: dataroomId,
        },
      });

      // delete group
      await prisma.viewerGroup.delete({
        where: {
          id: groupId,
          dataroomId: dataroomId,
        },
      });

      res.status(200).json({ success: true });
      return;
    } catch (error) {
      log({
        message: `Failed to delete group for dataroom: _${dataroomId}_. \n\n ${error} \n\n*Metadata*: \`{groupId: ${groupId}, teamId: ${teamId}, userId: ${userId}}\``,
        type: "error",
      });
      errorhandler(error, res);
    }
  },
});
