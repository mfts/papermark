import { waitUntil } from "@vercel/functions";

import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";

import IntegrationInstalled from "@/components/emails/installed-integration-notification";

interface InstallIntegration {
  userId: string;
  teamId: string;
  integrationId: string;
  credentials?: Record<string, any>;
}

// Install an integration for a user in a workspace
export const installIntegration = async ({
  userId,
  teamId,
  integrationId,
  credentials,
}: InstallIntegration) => {
  const installation = await prisma.installedIntegration.upsert({
    create: {
      userId,
      teamId,
      integrationId,
      credentials,
    },
    update: {
      credentials,
    },
    where: {
      teamId_integrationId: {
        teamId,
        integrationId,
      },
    },
  });

  waitUntil(
    (async () => {
      const team = await prisma.team.findUniqueOrThrow({
        where: {
          id: teamId,
        },
        select: {
          name: true,
          users: {
            where: { userId },
            select: {
              user: {
                select: { email: true },
              },
            },
          },
          installedIntegrations: {
            where: { integrationId },
            select: {
              integration: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      const email = team.users.length > 0 ? team.users[0].user.email : null;
      const integration =
        team.installedIntegrations.length > 0
          ? team.installedIntegrations[0].integration
          : null;

      if (email && integration) {
        await sendEmail({
          to: email,
          system: true,
          test: process.env.NODE_ENV === "development",
          subject: `The "${integration.name}" integration has been added to your team`,
          react: IntegrationInstalled({
            email: email,
            team: {
              name: team.name,
            },
            integration: {
              name: integration.name,
              slug: integration.slug,
            },
          }),
        });
      }
    })(),
  );

  return installation;
};
