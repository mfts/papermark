import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { teamId, groupId } = req.query as {
    teamId: string;
    groupId: string;
  };
  const userId = (session.user as CustomUser).id;

  // Verify team access
  const teamAccess = await prisma.userTeam.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
  });

  if (!teamAccess) {
    return res.status(401).end("Unauthorized");
  }

  if (req.method === "GET") {
    // GET /api/teams/:teamId/visitor-groups/:groupId
    try {
      const visitorGroup = await prisma.visitorGroup.findUnique({
        where: {
          id: groupId,
          teamId,
        },
        include: {
          links: {
            where: {
              link: {
                deletedAt: null,
                isArchived: false,
              },
            },
            include: {
              link: {
                select: {
                  id: true,
                  name: true,
                  linkType: true,
                  deletedAt: true,
                  isArchived: true,
                  documentId: true,
                  dataroomId: true,
                  document: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  dataroom: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: { links: true },
          },
        },
      });

      if (!visitorGroup) {
        return res.status(404).json({ error: "Visitor group not found." });
      }

      return res.status(200).json(visitorGroup);
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "PUT") {
    // PUT /api/teams/:teamId/visitor-groups/:groupId
    const { name, emails } = req.body as { name: string; emails: string[] };

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Group name is required." });
    }

    try {
      const visitorGroup = await prisma.visitorGroup.update({
        where: {
          id: groupId,
          teamId,
        },
        data: {
          name: name.trim(),
          emails: emails || [],
        },
        include: {
          _count: {
            select: { links: true },
          },
        },
      });

      return res.status(200).json(visitorGroup);
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/visitor-groups/:groupId
    try {
      // Check if the group is attached to any active (non-deleted) links
      const activeLinks = await prisma.linkVisitorGroup.findMany({
        where: {
          visitorGroupId: groupId,
          link: {
            deletedAt: null,
          },
        },
        include: {
          link: {
            select: {
              id: true,
              name: true,
              linkType: true,
              documentId: true,
              dataroomId: true,
            },
          },
        },
      });

      if (activeLinks.length > 0) {
        return res.status(400).json({
          error:
            "Cannot delete this visitor group because it is used by active links. Remove the group from those links first.",
          activeLinks: activeLinks.map((al) => ({
            linkId: al.link.id,
            linkName: al.link.name,
            linkType: al.link.linkType,
          })),
        });
      }

      await prisma.visitorGroup.delete({
        where: {
          id: groupId,
          teamId,
        },
      });

      return res.status(204).end();
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
