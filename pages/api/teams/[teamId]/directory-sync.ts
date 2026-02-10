import { NextApiRequest, NextApiResponse } from "next";

import { DirectoryType } from "@boxyhq/saml-jackson";
import { getServerSession } from "next-auth";
import { z } from "zod";

import initJackson, { getJacksonProduct } from "@/lib/jackson";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../auth/[...nextauth]";

const createDirectorySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  type: z
    .enum([
      "azure-scim-v2",
      "okta-scim-v2",
      "onelogin-scim-v2",
      "jumpcloud-scim-v2",
      "generic-scim-v2",
      "google",
    ])
    .optional(),
  webhook_url: z.string().url().optional(),
  webhook_secret: z.string().min(1).optional(),
});

const deleteDirectorySchema = z.object({
  directoryId: z.string().min(1).optional(),
});

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unexpected error";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { teamId } = req.query as { teamId: string };
  const userId = (session.user as CustomUser).id;

  const teamAccess = await prisma.userTeam.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!teamAccess) {
    return res.status(401).end("Unauthorized");
  }

  if (teamAccess.role !== "ADMIN") {
    return res
      .status(403)
      .json({ error: "Only team admins can manage directory sync." });
  }

  const product = getJacksonProduct();
  const { directorySyncController } = await initJackson();

  if (req.method === "GET") {
    const { data, error } =
      await directorySyncController.directories.getByTenantAndProduct(
        teamId,
        product,
      );

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ directories: data });
  }

  if (req.method === "POST") {
    const parsedBody = createDirectorySchema.safeParse(req.body ?? {});
    if (!parsedBody.success) {
      return res.status(400).json({ error: parsedBody.error.message });
    }

    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      select: {
        scimDirectoryId: true,
      },
    });

    const directoryType = (parsedBody.data.type ?? "azure-scim-v2") as DirectoryType;

    try {
      const [createdDirectory] = await Promise.all([
        directorySyncController.directories.create({
          tenant: teamId,
          product,
          name: parsedBody.data.name ?? "Microsoft Entra ID SCIM",
          type: directoryType,
          webhook_url: parsedBody.data.webhook_url,
          webhook_secret: parsedBody.data.webhook_secret,
        }),
        team?.scimDirectoryId
          ? directorySyncController.directories.delete(team.scimDirectoryId)
          : Promise.resolve(),
      ]);

      if (createdDirectory.error || !createdDirectory.data) {
        return res.status(400).json({
          error: createdDirectory.error?.message ?? "Failed to create directory.",
        });
      }

      await prisma.team.update({
        where: {
          id: teamId,
        },
        data: {
          scimEnabled: true,
          scimProvider: directoryType,
          scimDirectoryId: createdDirectory.data.id,
        },
      });

      return res.status(201).json(createdDirectory.data);
    } catch (error) {
      return res.status(400).json({ error: toErrorMessage(error) });
    }
  }

  if (req.method === "DELETE") {
    const parsedBody = deleteDirectorySchema.safeParse(req.body ?? {});
    if (!parsedBody.success) {
      return res.status(400).json({ error: parsedBody.error.message });
    }

    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      select: {
        scimDirectoryId: true,
      },
    });

    const directoryId = parsedBody.data.directoryId ?? team?.scimDirectoryId;
    if (!directoryId) {
      return res.status(400).json({ error: "No directoryId provided." });
    }

    const { error } = await directorySyncController.directories.delete(directoryId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    await prisma.team.update({
      where: {
        id: teamId,
      },
      data: {
        scimEnabled: false,
        scimProvider: null,
        scimDirectoryId: null,
      },
    });

    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
