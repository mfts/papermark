import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { ItemType } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

// Zod schema for validating permissions
const itemPermissionSchema = z.object({
  view: z.boolean(),
  download: z.boolean(),
  itemType: z.nativeEnum(ItemType),
});

const permissionsSchema = z.record(z.string(), itemPermissionSchema);

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/datarooms/:id/permission-groups/:permissionGroupId
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const {
      teamId,
      id: dataroomId,
      permissionGroupId,
    } = req.query as {
      teamId: string;
      id: string;
      permissionGroupId: string;
    };

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

      // Fetch permission group with access controls
      const permissionGroup = await prisma.permissionGroup.findUnique({
        where: {
          id: permissionGroupId,
          dataroomId: dataroomId,
          teamId: teamId,
        },
        include: {
          accessControls: {
            select: {
              id: true,
              itemId: true,
              itemType: true,
              canView: true,
              canDownload: true,
              canDownloadOriginal: true,
            },
          },
        },
      });

      if (!permissionGroup) {
        return res.status(404).json({ error: "Permission group not found" });
      }

      return res.status(200).json({ permissionGroup });
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "PUT") {
    // PUT /api/teams/:teamId/datarooms/:id/permission-groups/:permissionGroupId
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const {
      teamId,
      id: dataroomId,
      permissionGroupId,
    } = req.query as {
      teamId: string;
      id: string;
      permissionGroupId: string;
    };

    const { permissions } = req.body;

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

      // Verify permission group exists and belongs to dataroom
      const permissionGroup = await prisma.permissionGroup.findUnique({
        where: {
          id: permissionGroupId,
          dataroomId: dataroomId,
          teamId: teamId,
        },
      });

      if (!permissionGroup) {
        return res.status(404).json({ error: "Permission group not found" });
      }

      // Validate permissions payload using Zod
      if (!permissions) {
        return res.status(400).json({ error: "Permissions are required" });
      }

      // Validate schema structure
      const validationResult = permissionsSchema.safeParse(permissions);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid permissions format",
          details: validationResult.error.issues,
        });
      }

      const validatedPermissions = validationResult.data;

      // Update permission group access controls using a transaction
      const updatedPermissionGroup = await prisma.$transaction(async (tx) => {
        // Get existing access controls to determine what needs to be updated vs created
        const existingControls =
          await tx.permissionGroupAccessControls.findMany({
            where: {
              groupId: permissionGroupId,
            },
            select: {
              itemId: true,
              itemType: true,
              canView: true,
              canDownload: true,
              canDownloadOriginal: true,
            },
          });

        const existingMap = new Map(
          existingControls.map((control) => [
            `${control.itemId}-${control.itemType}`,
            control,
          ]),
        );

        const toUpdate: Array<{
          itemId: string;
          itemType: any;
          canView: boolean;
          canDownload: boolean;
          canDownloadOriginal: boolean;
        }> = [];

        const toCreate: Array<{
          groupId: string;
          itemId: string;
          itemType: any;
          canView: boolean;
          canDownload: boolean;
          canDownloadOriginal: boolean;
        }> = [];

        // Categorize permissions into updates vs creates
        Object.entries(validatedPermissions).forEach(([itemId, permission]) => {
          const key = `${itemId}-${permission.itemType}`;
          const existing = existingMap.get(key);

          const permissionData = {
            itemId,
            itemType: permission.itemType,
            canView: permission.view,
            canDownload: permission.download,
            canDownloadOriginal: false,
          };

          if (existing) {
            // Check if anything actually changed
            if (
              existing.canView !== permission.view ||
              existing.canDownload !== permission.download
            ) {
              toUpdate.push(permissionData);
            }
          } else {
            toCreate.push({
              groupId: permissionGroupId,
              ...permissionData,
            });
          }
        });

        // Perform updates
        if (toUpdate.length > 0) {
          await Promise.all(
            toUpdate.map((item) =>
              tx.permissionGroupAccessControls.updateMany({
                where: {
                  groupId: permissionGroupId,
                  itemId: item.itemId,
                  itemType: item.itemType,
                },
                data: {
                  canView: item.canView,
                  canDownload: item.canDownload,
                  canDownloadOriginal: item.canDownloadOriginal,
                },
              }),
            ),
          );
        }

        // Perform creates
        if (toCreate.length > 0) {
          await tx.permissionGroupAccessControls.createMany({
            data: toCreate,
          });
        }

        // Remove permissions that are no longer in the new set
        const newItemKeys = new Set(
          Object.entries(validatedPermissions).map(
            ([itemId, permission]) => `${itemId}-${permission.itemType}`,
          ),
        );

        const toDelete = existingControls.filter(
          (control) =>
            !newItemKeys.has(`${control.itemId}-${control.itemType}`),
        );

        if (toDelete.length > 0) {
          await Promise.all(
            toDelete.map((item) =>
              tx.permissionGroupAccessControls.deleteMany({
                where: {
                  groupId: permissionGroupId,
                  itemId: item.itemId,
                  itemType: item.itemType,
                },
              }),
            ),
          );
        }

        // Return the updated permission group with access controls
        return await tx.permissionGroup.findUnique({
          where: { id: permissionGroupId },
          include: {
            accessControls: {
              select: {
                id: true,
                itemId: true,
                itemType: true,
                canView: true,
                canDownload: true,
                canDownloadOriginal: true,
              },
            },
          },
        });
      });

      return res.status(200).json({ permissionGroup: updatedPermissionGroup });
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/datarooms/:id/permission-groups/:permissionGroupId
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const {
      teamId,
      id: dataroomId,
      permissionGroupId,
    } = req.query as {
      teamId: string;
      id: string;
      permissionGroupId: string;
    };

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

      // Verify permission group exists and belongs to dataroom
      const permissionGroup = await prisma.permissionGroup.findUnique({
        where: {
          id: permissionGroupId,
          dataroomId: dataroomId,
          teamId: teamId,
        },
      });

      if (!permissionGroup) {
        return res.status(404).json({ error: "Permission group not found" });
      }

      // Delete the permission group (this will cascade delete the access controls)
      await prisma.permissionGroup.delete({
        where: {
          id: permissionGroupId,
        },
      });

      return res
        .status(200)
        .json({ message: "Permission group deleted successfully" });
    } catch (error) {
      errorhandler(error, res);
    }
  }

  // We only allow GET, PUT, and DELETE requests
  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
