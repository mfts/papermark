import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { sanitizeList } from "@/lib/utils";

import { authOptions } from "../../auth/[...nextauth]";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { teamId } = req.query;

  if (typeof teamId !== "string") {
    return res.status(400).json({ error: "Invalid teamId" });
  }

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      users: {
        some: {
          userId: (session.user as CustomUser).id,
        },
      },
    },
    include: {
      users: true,
    },
  });

  if (!team) {
    return res.status(404).json({ error: "Team not found" });
  }

  const isUserAdminOrManager = team.users.some(
    (user) =>
      (user.role === "ADMIN" || user.role === "MANAGER") && user.userId === (session.user as CustomUser).id,
  );

  if (!isUserAdminOrManager) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method === "GET") {
    return res.status(200).json(team.ignoredDomains || []);
  }

  if (req.method === "PUT") {
    try {
      const { domains } = req.body;

      if (!Array.isArray(domains)) {
        return res.status(400).json({ error: "Invalid domains list" });
      }

      const uniqueDomains = sanitizeList(domains.join("\n"), "domain");

      await prisma.team.update({
        where: {
          id: teamId,
        },
        data: {
          ignoredDomains: uniqueDomains,
        },
      });

      return res.status(200).json({ message: "Ignored domains updated" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

export default handler;
