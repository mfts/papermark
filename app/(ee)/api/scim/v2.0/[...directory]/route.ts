import { jackson } from "@/lib/jackson";
import prisma from "@/lib/prisma";
import type { DirectorySyncEvent } from "@boxyhq/saml-jackson";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const handler = async (
  req: Request,
  { params }: { params: Promise<{ directory: string[] }> },
) => {
  try {
    const resolvedParams = await params;
    const headersList = await headers();
    const authHeader = headersList.get("Authorization");
    const apiSecret = authHeader ? authHeader.split(" ")[1] : null;

    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());

    const [directoryId, path, resourceId] = resolvedParams.directory;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { directorySyncController } = await jackson();

    const request = {
      method: req.method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
      body,
      directoryId,
      resourceId,
      resourceType: (path === "Users" ? "users" : "groups") as
        | "users"
        | "groups",
      apiSecret,
      query: {
        count: query.count ? parseInt(query.count) : undefined,
        startIndex: query.startIndex ? parseInt(query.startIndex) : undefined,
        filter: query.filter as string,
      },
    };

    const { status, data } = await directorySyncController.requests.handle(
      request,
      handleSCIMEvents,
    );

    return NextResponse.json(data, { status });
  } catch (error: any) {
    console.error("[SCIM] Request error:", error);
    return NextResponse.json(
      {
        schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
        detail: error.message || "Internal server error",
        status: 500,
      },
      { status: 500 },
    );
  }
};

export {
  handler as DELETE,
  handler as GET,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};

// ──────────────────────────────────────────────────────────
// SCIM Event Handler — sync changes to the main app DB
// ──────────────────────────────────────────────────────────
async function handleSCIMEvents(event: DirectorySyncEvent) {
  const { event: eventType, data, tenant } = event;

  // Verify the team exists and has SSO enabled
  const team = await prisma.team.findUnique({
    where: { id: tenant },
    select: { id: true, plan: true, ssoEnabled: true },
  });

  if (!team || !team.ssoEnabled) {
    console.warn(
      `[SCIM] Ignoring event for tenant ${tenant} — SSO not enabled`,
    );
    return;
  }

  // Plan gate: only datarooms-premium or higher
  const allowedPlans = ["datarooms-premium", "datarooms-premium+old"];
  if (!allowedPlans.includes(team.plan)) {
    console.warn(
      `[SCIM] Ignoring event for tenant ${tenant} — plan ${team.plan} not eligible`,
    );
    return;
  }

  if (!("email" in data) || !data.email) {
    return;
  }

  try {
    switch (eventType) {
      case "user.created": {
        console.log(
          `[SCIM] User created: ${data.email} for tenant ${tenant}`,
        );

        const user = await prisma.user.upsert({
          where: { email: data.email },
          create: {
            email: data.email,
            name: [data.first_name, data.last_name].filter(Boolean).join(" "),
          },
          update: {},
        });

        await prisma.userTeam.upsert({
          where: {
            userId_teamId: {
              userId: user.id,
              teamId: tenant,
            },
          },
          update: {},
          create: {
            userId: user.id,
            teamId: tenant,
            role: "MEMBER",
          },
        });
        break;
      }

      case "user.updated": {
        console.log(
          `[SCIM] User updated: ${data.email} for tenant ${tenant}`,
        );

        // Handle Azure AD's active/inactive (can be boolean or string)
        const isActive =
          (data as any).active === true || (data as any).active === "True";
        const isInactive =
          (data as any).active === false || (data as any).active === "False";

        if (isInactive) {
          // Deactivated — remove from team (same as user.deleted)
          const user = await prisma.user.findUnique({
            where: { email: data.email },
          });

          if (user) {
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
        } else if (isActive) {
          // Reactivated — re-add to team
          const user = await prisma.user.upsert({
            where: { email: data.email },
            create: {
              email: data.email,
              name: [data.first_name, data.last_name]
                .filter(Boolean)
                .join(" "),
            },
            update: {
              name:
                [data.first_name, data.last_name].filter(Boolean).join(" ") ||
                undefined,
            },
          });

          await prisma.userTeam.upsert({
            where: {
              userId_teamId: {
                userId: user.id,
                teamId: tenant,
              },
            },
            update: {},
            create: {
              userId: user.id,
              teamId: tenant,
              role: "MEMBER",
            },
          });
        } else {
          // Just a name/attribute update
          await prisma.user
            .update({
              where: { email: data.email },
              data: {
                name:
                  [data.first_name, data.last_name]
                    .filter(Boolean)
                    .join(" ") || undefined,
              },
            })
            .catch(() => {
              console.warn(
                `[SCIM] Could not update user ${data.email} — user not found`,
              );
            });
        }
        break;
      }

      case "user.deleted": {
        console.log(
          `[SCIM] User deleted: ${data.email} for tenant ${tenant}`,
        );

        const user = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (user) {
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
        break;
      }

      case "group.created":
      case "group.updated":
      case "group.deleted":
      case "group.user_added":
      case "group.user_removed": {
        console.log(`[SCIM] Group event ${eventType} for tenant ${tenant}`);
        break;
      }
    }
  } catch (error) {
    console.error(`[SCIM] Error handling event ${eventType}:`, error);
  }
}
