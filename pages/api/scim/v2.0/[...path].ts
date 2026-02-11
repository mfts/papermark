import { NextApiRequest, NextApiResponse } from "next";

import { jackson } from "@/lib/jackson";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { directorySyncController } = await jackson();

    // Build the full path from the catch-all segments
    const pathSegments = req.query.path as string[];
    // pathSegments: [directoryId, "Users" | "Groups", resourceId?]

    const directoryId = pathSegments[0] || "";
    const resourceType = pathSegments[1] || ""; // "Users" or "Groups"
    const resourceId = pathSegments[2] || undefined;

    // Extract the authorization header (Bearer token from IdP)
    const authorization = req.headers.authorization || "";

    // Parse request body for POST/PUT/PATCH
    let body: any = {};
    if (["POST", "PUT", "PATCH"].includes(req.method || "")) {
      body = req.body || {};
    }

    // Build query params
    const query: Record<string, string> = {};
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== "path" && typeof value === "string") {
        query[key] = value;
      }
    });

    const response = await directorySyncController.requests.handle(
      {
        method: req.method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
        body,
        query,
        directoryId,
        resourceType,
        resourceId,
        apiSecret: authorization.replace("Bearer ", ""),
      },
      handleSCIMEvents,
    );

    return res.status(response.status).json(response.data || {});
  } catch (error: any) {
    console.error("[SCIM] Request error:", error);
    return res.status(500).json({
      schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
      detail: error.message || "Internal server error",
      status: 500,
    });
  }
}

// SCIM Event Handler — sync changes to the main app DB
async function handleSCIMEvents(event: any) {
  const { event: eventType, data, tenant } = event;

  try {
    switch (eventType) {
      case "user.created": {
        // A new user was provisioned from the IdP
        console.log(
          `[SCIM] User created: ${data.email} for tenant ${tenant}`,
        );

        if (data.email) {
          // Create or find the user
          const user = await prisma.user.upsert({
            where: { email: data.email },
            create: {
              email: data.email,
              name: [data.first_name, data.last_name]
                .filter(Boolean)
                .join(" "),
            },
            update: {},
          });

          // Add user to the team if not already a member
          const existingMembership = await prisma.userTeam.findUnique({
            where: {
              userId_teamId: {
                userId: user.id,
                teamId: tenant,
              },
            },
          });

          if (!existingMembership) {
            await prisma.userTeam.create({
              data: {
                userId: user.id,
                teamId: tenant,
                role: "MEMBER",
              },
            });
          }
        }
        break;
      }

      case "user.updated": {
        // User attributes changed in the IdP
        console.log(
          `[SCIM] User updated: ${data.email} for tenant ${tenant}`,
        );

        if (data.email) {
          await prisma.user.update({
            where: { email: data.email },
            data: {
              name: [data.first_name, data.last_name]
                .filter(Boolean)
                .join(" "),
            },
          }).catch(() => {
            // User might not exist yet
            console.warn(
              `[SCIM] Could not update user ${data.email} — user not found`,
            );
          });
        }
        break;
      }

      case "user.deleted": {
        // User deprovisioned / deactivated in the IdP
        console.log(
          `[SCIM] User deleted: ${data.email} for tenant ${tenant}`,
        );

        if (data.email) {
          const user = await prisma.user.findUnique({
            where: { email: data.email },
          });

          if (user) {
            // Remove user from the team (don't delete the user account)
            await prisma.userTeam
              .delete({
                where: {
                  userId_teamId: {
                    userId: user.id,
                    teamId: tenant,
                  },
                },
              })
              .catch(() => {
                console.warn(
                  `[SCIM] Could not remove team membership for ${data.email}`,
                );
              });
          }
        }
        break;
      }

      case "group.created":
      case "group.updated":
      case "group.deleted": {
        // Handle group sync if needed
        console.log(
          `[SCIM] Group event ${eventType} for tenant ${tenant}`,
        );
        break;
      }

      case "group.user_added": {
        // User added to a group in the IdP
        console.log(
          `[SCIM] User added to group for tenant ${tenant}`,
        );
        break;
      }

      case "group.user_removed": {
        // User removed from a group in the IdP
        console.log(
          `[SCIM] User removed from group for tenant ${tenant}`,
        );
        break;
      }
    }
  } catch (error) {
    console.error(`[SCIM] Error handling event ${eventType}:`, error);
  }
}
