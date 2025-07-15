import { NextApiResponse } from "next";

import { ItemType } from "@prisma/client";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default createTeamHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // POST /api/teams/:teamId/datarooms/:id/groups/:groupId/permissions

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

      const existingPermissions =
        await prisma.viewerGroupAccessControls.findMany({
          where: {
            groupId,
            group: { dataroomId },
          },
          select: { itemId: true, itemType: true },
        });

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
      return;
    } catch (error) {
      console.error("Error updating permissions:", error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  },
});
