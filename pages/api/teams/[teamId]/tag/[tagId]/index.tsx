import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { createTagBodySchema } from "..";

const updateTagBodySchema = createTagBodySchema;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { teamId } = req.query as { teamId: string };

  try {
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      select: {
        id: true,
        users: { select: { userId: true } },
      },
    });

    // check that the user is member of the team, otherwise return 403
    const teamUsers = team?.users;
    const isUserPartOfTeam = teamUsers?.some(
      (user) => user.userId === (session.user as CustomUser).id,
    );
    if (!isUserPartOfTeam) {
      return res.status(403).end("Unauthorized to access this team");
    }
  } catch (error) {
    errorhandler(error, res);
  }
  if (req.method === "PUT") {
    // PUT /api/teams/:teamId/tag/[tagId]

    const { teamId, tagId } = req.query as { teamId: string; tagId: string };
    const {
      name,
      color,
      description = "",
    } = updateTagBodySchema.parse(req.body);
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        teamId: teamId,
      },
    });

    if (!tag) {
      return res.status(404).json({ error: "Tag not found." });
    }
    try {
      const response = await prisma.tag.update({
        where: {
          id: tagId,
        },
        data: {
          name,
          color,
          description,
        },
      });

      return res.status(200).json(response);
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  } else if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/tag/[tagId]
    const { teamId, tagId } = req.query as { teamId: string; tagId: string };
    // First verify the tag belongs to the team
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        teamId: teamId,
      },
    });

    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    // Then delete the tag
    await prisma.tag.delete({
      where: {
        id: tagId,
      },
      include: {
        taggedItems: true,
      },
    });
    return res.status(204).end();
  } else {
    // We only allow GET and DELETE requests
    res.setHeader("Allow", ["PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
