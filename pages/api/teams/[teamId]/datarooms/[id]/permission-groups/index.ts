import { NextApiResponse } from "next";

import { ItemType } from "@prisma/client";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // POST /api/teams/:teamId/datarooms/:id/permission-groups
    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };
    const { permissions, linkId } = req.body;

    try {
      // Verify dataroom exists and belongs to team
      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          teamId: teamId,
        },
      });

      if (!dataroom) {
        return res.status(404).json({ error: "Dataroom not found" });
      }

      // Create permission group and access controls in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the permission group
        const permissionGroup = await tx.permissionGroup.create({
          data: {
            name: `Link Permissions ${Date.now()}`,
            description: "Auto-generated permission group for link",
            dataroomId: dataroomId,
            teamId: teamId,
          },
        });

        // Prepare access control data for batch insert
        const accessControlData = Object.entries(permissions).map(
          ([itemId, permission]) => {
            const perm = permission as {
              view: boolean;
              download: boolean;
              itemType: ItemType;
            };
            return {
              groupId: permissionGroup.id,
              itemId: itemId,
              itemType: perm.itemType,
              canView: perm.view,
              canDownload: perm.download,
              canDownloadOriginal: false,
            };
          },
        );

        // Create all access controls in a single batch operation
        await tx.permissionGroupAccessControls.createMany({
          data: accessControlData,
        });

        // Fetch the created access controls for return data
        const accessControls = await tx.permissionGroupAccessControls.findMany({
          where: {
            groupId: permissionGroup.id,
          },
        });

        // Update the link with the permission group
        if (linkId) {
          await tx.link.update({
            where: { id: linkId, teamId: teamId },
            data: {
              permissionGroupId: permissionGroup.id,
            },
          });
        }

        return {
          permissionGroup,
          accessControls,
        };
      });

      return res.status(200).json(result);
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
