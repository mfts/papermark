import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import { jackson } from "@/lib/jackson";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const userId = (session.user as CustomUser).id;
  const { teamId } = req.query as { teamId: string };

  // Verify user has access to the team and is an admin
  const teamAccess = await prisma.userTeam.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
    select: { role: true },
  });

  if (!teamAccess) {
    return res.status(401).end("Unauthorized");
  }

  if (teamAccess.role !== "ADMIN") {
    return res
      .status(403)
      .json({ error: "Only admins can manage Directory Sync" });
  }

  if (req.method === "GET") {
    // GET /api/teams/:teamId/directory-sync — list directory sync connections
    try {
      const { directorySyncController } = await jackson();

      const { data, error } =
        await directorySyncController.directories.getByTenantAndProduct(
          teamId,
          process.env.JACKSON_PRODUCT!,
        );

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json(data);
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/directory-sync — create directory sync connection
    try {
      const { directorySyncController } = await jackson();

      const { name, type, webhook_url, webhook_secret } = req.body;

      const { data, error } =
        await directorySyncController.directories.create({
          tenant: teamId,
          product: process.env.JACKSON_PRODUCT!,
          name: name || "Directory Sync",
          type: type || "azure-scim-v2",
          webhook_url: webhook_url || undefined,
          webhook_secret: webhook_secret || undefined,
        });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      // Mark team as SCIM-enabled
      await prisma.team.update({
        where: { id: teamId },
        data: {
          scimEnabled: true,
          scimProvider: type || "azure-scim-v2",
          scimDirectoryId: (data as any)?.id || null,
        },
      });

      // data contains: id, scim.endpoint, scim.secret
      return res.status(201).json(data);
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/directory-sync — delete directory sync connection
    try {
      const { directorySyncController } = await jackson();

      const { directoryId } = req.body;

      if (!directoryId) {
        return res.status(400).json({ error: "directoryId is required" });
      }

      const { error } =
        await directorySyncController.directories.delete(directoryId);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      // Check remaining directories
      const { data: remaining } =
        await directorySyncController.directories.getByTenantAndProduct(
          teamId,
          process.env.JACKSON_PRODUCT!,
        );

      if (
        !remaining ||
        (Array.isArray(remaining) && remaining.length === 0)
      ) {
        await prisma.team.update({
          where: { id: teamId },
          data: {
            scimEnabled: false,
            scimProvider: null,
            scimDirectoryId: null,
          },
        });
      }

      return res.status(200).json({ ok: true });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
