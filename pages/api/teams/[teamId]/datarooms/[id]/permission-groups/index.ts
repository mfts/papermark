import { NextApiRequest, NextApiResponse } from "next";

import { ItemType } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../../../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // POST /api/teams/:teamId/datarooms/:id/permission-groups
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };
    const { permissions, linkId } = req.body;

    const userId = (session.user as CustomUser).id;

    try {
      // Verify team membership
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: { userId },
          },
        },
      });

      if (!team) {
        return res.status(401).end("Unauthorized");
      }

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
  }

  // We only allow POST requests
  res.setHeader("Allow", ["POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
