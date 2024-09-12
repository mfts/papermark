import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { ItemType } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // POST /api/teams/:teamId/datarooms/:id/groups/:groupId/permissions
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).end("Unauthorized");
    return;
  }

  const userId = (session.user as CustomUser).id;
  const { teamId } = req.query as { teamId: string };

  try {
    const { dataroomId, groupId, permissions } = req.body as {
      dataroomId: string;
      groupId: string;
      permissions: Record<
        string,
        { itemType: ItemType; view: boolean; download: boolean }
      >;
    };

    // Validate input
    if (!dataroomId || !groupId || !permissions) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if the user is part of the team
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
        users: {
          some: {
            userId,
          },
        },
      },
    });

    if (!team) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const existingPermissions = await prisma.viewerGroupAccessControls.findMany(
      {
        where: {
          groupId,
          group: { dataroomId },
        },
        select: { itemId: true, itemType: true },
      },
    );

    const existingSet = new Set(
      existingPermissions.map((p) => `${p.itemId}-${p.itemType}`),
    );

    const toUpdate: {
      groupId: string;
      itemId: string;
      itemType: ItemType;
      canView: boolean;
      canDownload: boolean;
    }[] = [];
    const toCreate: {
      groupId: string;
      itemId: string;
      itemType: ItemType;
      canView: boolean;
      canDownload: boolean;
    }[] = [];

    Object.entries(permissions).forEach(([itemId, itemPermissions]) => {
      const key = `${itemId}-${itemPermissions.itemType}`;
      const data = {
        groupId,
        itemId,
        itemType: itemPermissions.itemType,
        canView: itemPermissions.view,
        canDownload: itemPermissions.download,
      };

      if (existingSet.has(key)) {
        toUpdate.push(data);
      } else {
        toCreate.push(data);
      }
    });

    console.log("toUpdate", toUpdate);
    console.log("toCreate", toCreate);

    // Perform operations
    await prisma.$transaction(async (tx) => {
      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map((item) =>
            tx.viewerGroupAccessControls.update({
              where: {
                groupId_itemId: {
                  groupId: item.groupId,
                  itemId: item.itemId,
                },
              },
              data: {
                canView: item.canView,
                canDownload: item.canDownload,
              },
            }),
          ),
        );
      }

      if (toCreate.length > 0) {
        await tx.viewerGroupAccessControls.createMany({
          data: toCreate,
        });
      }
    });

    res.status(200).json({ message: "Permissions updated successfully" });
  } catch (error) {
    console.error("Error updating permissions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
