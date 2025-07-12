import { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // POST /api/teams/:teamId/datarooms/:id/groups/:groupId/members
  const {
    teamId,
    id: dataroomId,
    groupId,
  } = req.query as {
    teamId: string;
    id: string;
    groupId: string;
  };

  const { emails, domains, allowAll } = req.body as {
    emails: string[];
    domains: string[];
    allowAll: boolean;
  };

  try {
    // Check if the group belongs to the dataroom
    const group = await prisma.viewerGroup.findUnique({
      where: {
        id: groupId,
        dataroomId: dataroomId,
      },
    });

    if (!group) {
      res.status(404).end("Group not found");
      return;
    }

    // First, create or connect viewers
    await prisma.viewer.createMany({
      data: emails.map((email) => ({
        email,
        teamId,
      })),
      skipDuplicates: true,
    });

    const viewers = await prisma.viewer.findMany({
      where: {
        teamId: teamId,
        email: {
          in: emails,
        },
      },
      select: { id: true },
    });

    // Then, create the membership
    const members = await prisma.viewerGroupMembership.createMany({
      data: viewers.map((viewer) => ({
        groupId: groupId,
        viewerId: viewer.id,
      })),
    });

    // Update the group with the new domains and allowAll setting
    await prisma.viewerGroup.update({
      where: { id: groupId },
      data: { domains, allowAll },
    });

    res.status(201).json(members);
  } catch (error) {
    console.error("Request error", error);
    res.status(500).json({ error: "Error creating folder" });
  }
}

export default createTeamHandler({
  POST: handler,
});
