import { NextApiRequest, NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

import { createTagBodySchema } from "..";

const updateTagBodySchema = createTagBodySchema;

export default createTeamHandler({
  PUT: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId, id } = req.query as { teamId: string; id: string };
    const {
      name,
      color,
      description = "",
    } = updateTagBodySchema.parse(req.body);

    const tag = await prisma.tag.findUnique({
      where: {
        id: id,
        teamId: teamId,
      },
    });

    if (!tag) {
      return res.status(404).json({ error: "Tag not found." });
    }

    try {
      const response = await prisma.tag.update({
        where: {
          id: id,
        },
        data: {
          name,
          color,
          description,
        },
      });

      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  DELETE: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId, id } = req.query as { teamId: string; id: string };

    // First verify the tag belongs to the team
    const tag = await prisma.tag.findUnique({
      where: { id, teamId },
    });

    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    // Then delete the tag
    await prisma.tag.delete({
      where: { id, teamId },
      include: {
        items: true,
      },
    });
    res.status(204).end();
  },
});
