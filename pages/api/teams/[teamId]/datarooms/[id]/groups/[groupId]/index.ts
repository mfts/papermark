import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/datarooms/:id/groups/:groupId
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const {
      teamId,
      id: dataroomId,
      groupId,
    } = req.query as {
      teamId: string;
      id: string;
      groupId: string;
    };
    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: (session.user as CustomUser).id,
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (!team) {
        return res.status(403).end("Unauthorized to access this team");
      }

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
  } else if (req.method === "PATCH") {
    // PATCH /api/teams/:teamId/datarooms/:id/groups/:groupId
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const {
      teamId,
      id: dataroomId,
      groupId,
    } = req.query as {
      teamId: string;
      id: string;
      groupId: string;
    };

    const { name, allowAll, domains } = req.body as {
      name?: string;
      allowAll?: boolean;
      domains?: string[];
    };
    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findFirst({
        where: {
          id: teamId,
          users: {
            some: {
              userId: userId,
            },
          },
        },
      });

      if (!team) {
        return res.status(401).end("Unauthorized");
      }

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
  } else if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/datarooms/:id/groups/:groupId
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const {
      teamId,
      id: dataroomId,
      groupId,
    } = req.query as {
      teamId: string;
      id: string;
      groupId: string;
    };
    const userId = (session.user as CustomUser).id;

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
  } else {
    // We only allow GET, PATCH, DELETE requests
    res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
